# Bundesstelle Open Data API

This repository contains a list of APIs documented by [BundDEV](https://github.com/bundesAPI).

This list is provided at the following link: [api.bund.dev](https://api.bund.dev).


### Documentation
The documentation for this API can be found at [here](https://api.bund.dev/docs/).

---

### Refresh

Every 24 hours, a GitHub action will check for changes and new APIs. If changes are detected, there will be a pull request for the changes to the `index.json`.

### Overrides
Since not every information is provided by the OpenAPI or the GitHub repository of an API the `overrides.json` contains additional information which is added.


### Actions

[![Refresh API list](https://github.com/bundesAPI/apis/actions/workflows/refresh.yml/badge.svg)](https://github.com/bundesAPI/apis/actions/workflows/refresh.yml)