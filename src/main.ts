import * as core from '@actions/core'
import S3 from 'aws-sdk/clients/s3'
import * as github from '@actions/github'
import * as util from './util'
import * as yaml from 'js-yaml'
import {IMinimatch} from 'minimatch'

async function run(): Promise<void> {
  try {
    let result = false

    const prNumber = util.getPrNumber()
    if (!prNumber) {
      // TODO
      core.setOutput('result', result)
      return
    }

    const s3 = new S3({
      accessKeyId: process.env['AWS_ACCESS_KEY_ID'],
      secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'],
      region: process.env['AWS_DEFAULT_REGION']
    })
    const body = util.fetchBody(
      s3,
      core.getInput('s3-bucket') || '',
      core.getInput('s3-key') || ''
    )
    const matchers: IMinimatch[] = util.getMatchers(yaml.safeLoad(body))

    const token: string = core.getInput('github-token')
    const client: any = github.getOctokit(token, {log: console})

    const changedFiles = await util.getChangedFiles(client, prNumber)
    for (const changedFile of changedFiles) {
      if (util.isMatch(changedFile, matchers)) {
        result = true
        break
      }
    }

    core.setOutput('result', result)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
