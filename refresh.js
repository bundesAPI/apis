const axios = require('axios')
const yaml = require('js-yaml')
const fs = require('fs/promises')

const getRepoData = async (repo) => {
  // fetch openapi spec and CNAME
  const [{ data: rawRepoData}, { data: cnameData }] = await Promise.all([
    axios.get(`https://raw.githubusercontent.com/bundesAPI/${repo}/main/openapi.yaml`),
    axios.get(`https://raw.githubusercontent.com/bundesAPI/${repo}/main/CNAME`)
  ])
  const repoData = yaml.load(rawRepoData)

  return {
    name: repoData.info.title,
    office: repoData.info['x-office'],
  }
}

const main = async () => {
  // fetch repo list
  const { data } = await axios.get('https://api.github.com/users/BundesAPI/repos')

  // only check repos that end in "-api"
  const repos = data.filter((repo) => repo.name.endsWith('-api'))

  const result = await Promise.all(repos.map(async (repo) => {
    const { data: rawRepoData } = await axios.get(`https://raw.githubusercontent.com/bundesAPI/${repo.name}/main/openapi.yaml`)
    const repoData = yaml.load(rawRepoData)

    return {
      name: repoData.info.title,
      office: repoData.info['x-office'],
      description: repo.description,
      documentationURL: repo.homepage,
      githubURL: repo.html_url
    }
  }))

  console.log(result)

  const overridesRaw = await fs.readFile('./overrides.json', { encoding: 'utf-8' })
  const overrides = await JSON.parse(overridesRaw)

  // upsert list
  const newList = result.map((repo) => {
    const overrideIndex = overrides.findIndex((e) => e.githubURL === repo.githubURL)
    if (overrideIndex === -1) return repo

    return {
      ...repo,
      ...overrides[overrideIndex]
    }
  })

  // write list back
  await fs.writeFile('./index.json', JSON.stringify(newList, null, 2), { encoding: 'utf-8' })
}

main()