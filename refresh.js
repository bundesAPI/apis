const axios = require('axios')
const yaml = require('js-yaml')
const fs = require('fs/promises')

const main = async () => {
  let empty = false
  let page = 1
  let entries = []

  while (!empty) {
    // fetch repo list
    const { data } = await axios.get(`https://api.github.com/users/BundesAPI/repos?page=${page}`)

    // break on empty list
    if (data.length === 0) empty = true
  
    // only check repos that end in "-api"
    const repos = data.filter((repo) => repo.name.endsWith('-api'))
  
    const result = await Promise.all(repos.map(async (repo) => {
      const rawOpenAPI = `https://raw.githubusercontent.com/bundesAPI/${repo.name}/main/openapi.yaml`
      const { data: rawRepoData } = await axios.get(rawOpenAPI)
      const repoData = yaml.load(rawRepoData)
  
      return {
        name: repoData.info.title,
        office: repoData.info['x-office'],
        description: repo.description,
        documentationURL: repo.homepage,
        githubURL: repo.html_url,
        rawOpenAPI: rawOpenAPI
      }
    }))

    entries.push(...result)
    page += 1
  }


  const overridesRaw = await fs.readFile('./overrides.json', { encoding: 'utf-8' })
  const overrides = await JSON.parse(overridesRaw)

  const externalsRaw = await fs.readFile('./externals.json', { encoding: 'utf-8' })
  const externals = await JSON.parse(externalsRaw)


  // upsert list
  const newList = entries.map((repo) => {
    const overrideIndex = overrides.findIndex((e) => e.githubURL === repo.githubURL)
    if (overrideIndex === -1) return repo

    return {
      ...repo,
      ...overrides[overrideIndex]
    }
  })

  // write list back
  await fs.writeFile('./index.json', JSON.stringify([...newList, ...externals], null, 2), { encoding: 'utf-8' })
}

main()
