import * as core from '@actions/core'
import AWS from 'aws-sdk'
import * as github from '@actions/github'
import * as util from './util'
import {IMinimatch} from 'minimatch'

async function run(): Promise<void> {
  try {
    let result = false

    const prNumber = util.getPrNumber()
    if (!prNumber) {
      core.debug('prNumber is undefined.')
      core.setOutput('result', result)
      return
    }
    core.debug(`prNumber is ${prNumber}`)

    const s3 = new AWS.S3({
      accessKeyId: process.env['AWS_ACCESS_KEY_ID'] || '',
      secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'] || '',
      region: process.env['AWS_DEFAULT_REGION'] || 'ap-northeast-1'
    })
    const targetFiles = await util.fetchTargetFiles(
      s3,
      core.getInput('s3-bucket') || '',
      core.getInput('s3-key-prefix') || ''
    )

    if (!targetFiles) {
      throw new Error('targetFiles is undefined.')
    }

    const matchers: IMinimatch[] = util.getMatchers(targetFiles)

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
