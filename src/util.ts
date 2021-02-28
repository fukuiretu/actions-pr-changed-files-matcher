import * as core from '@actions/core'
import * as github from '@actions/github'
import {Minimatch, IMinimatch} from 'minimatch'
import AWS from 'aws-sdk'

export function isMatch(changedFile: string, matchers: IMinimatch[]): boolean {
  core.debug(`    matching patterns against file ${changedFile}`)
  for (const matcher of matchers) {
    if (!matcher.match(changedFile)) {
      return false
    }
  }

  core.debug(`   all patterns matched`)
  return true
}

export function getPrNumber(): number | undefined {
  const pullRequest = github.context.payload.pull_request
  if (!pullRequest) {
    return undefined
  }

  return pullRequest.number
}

export async function getChangedFiles(
  client: any,
  prNumber: number
): Promise<string[]> {
  const listFilesOptions = client.pulls.listFiles.endpoint.merge({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    pull_number: prNumber
  })

  const listFilesResponse = await client.paginate(listFilesOptions)
  const changedFiles = listFilesResponse.map(f => f.filename)

  core.debug('found changed files:')
  for (const file of changedFiles) {
    core.debug(file)
  }

  return changedFiles
}

export function getMatchers(files: string[]): IMinimatch[] {
  const matchers = files.map(f => new Minimatch(f))

  return matchers
}

export async function fetchBody(
  s3: AWS.S3,
  bucket: string,
  key: string
): Promise<string | undefined> {
  const params = {
    Bucket: bucket,
    Key: key
  }

  const data = await s3.getObject(params).promise()
  core.debug(`fetch data from s3.${JSON.stringify(data)}`)

  return data.Body?.toString('utf-8')
}
