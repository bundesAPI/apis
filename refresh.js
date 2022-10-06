const axios = require('axios')
const yaml = require('js-yaml')
const fs = require('fs/promises')
const toml = require('toml');

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

      const rawPyprojectToml = `https://raw.githubusercontent.com/bundesAPI/${repo.name}/main/python-client/pyproject.toml`


      const { data: rawRepoData } = await axios.get(rawOpenAPI)

      var package_name = null;
    try {
           const { data: rawPyprojectTomlData } = await axios.get(rawPyprojectToml)
           const tomlData = toml.parse(rawPyprojectTomlData);
           package_name = tomlData["tool"]["poetry"]["name"]

    } catch (exception) {
      console.log(`Error fetching pypi url for ${repo.name}`);
    }

      const repoData = yaml.load(rawRepoData)
     var result = {
        name: repoData.info.title,
        office: repoData.info['x-office'],
        description: repo.description,
        documentationURL: repo.homepage,
        githubURL: repo.html_url,
        rawOpenAPI: rawOpenAPI,
      }

       if (package_name) result["pypiURL"] = `https://pypi.org/project/${package_name}`
       else result["pypiURL"] = null


      return result
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
