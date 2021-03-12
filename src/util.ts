import * as core from '@actions/core'
import * as github from '@actions/github'
import {Minimatch, IMinimatch} from 'minimatch'
import AWS from 'aws-sdk'
import dayjs from 'dayjs'
import yaml from 'js-yaml'

export function isMatch(changedFile: string, matchers: IMinimatch[]): boolean {
  core.debug(`    matching patterns against file ${changedFile}`)
  for (const matcher of matchers) {
    if (matcher.match(changedFile)) {
      return true
    }
  }

  return false
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

export async function fetchTargetFiles(
  s3: AWS.S3,
  bucket: string,
  prefix: string
): Promise<string[] | undefined> {
  const listObjects = await s3
    .listObjectsV2({
      Bucket: bucket,
      Prefix: prefix
    })
    .promise()
  const latest = listObjects?.Contents?.reduce((a, b) =>
    dayjs(a.LastModified).isAfter(dayjs(b.LastModified)) ? a : b
  )
  if (!latest) {
    throw Error('undefind list objects')
  }

  const obj = await s3
    .getObject({Bucket: bucket, Key: latest.Key || ''})
    .promise()
  core.debug(`fetch data from s3.${JSON.stringify(obj)}`)
  core.debug(`body: ${obj.Body?.toString('utf-8')}`)

  return yaml.safeLoad(obj.Body)
}
