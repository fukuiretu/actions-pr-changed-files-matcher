import * as core from '@actions/core';
import S3 from 'aws-sdk/clients/s3';
import * as github from '@actions/github';
import * as util from './util';
import * as yaml from 'js-yaml';
import { IMinimatch } from 'minimatch';

async function run(): Promise<void> {
  try {
    let result = false;

    const prNumber = util.getPrNumber();
    if (!prNumber) {
      // TODO
      core.setOutput('result', result)
      return;
    }

    const s3 = new S3({
      accessKeyId: process.env['AWS_ACCESS_KEY'],
      secretAccessKey: process.env['AWS_SEACRET'],
      region: process.env['AWS_REGION']
    });
    const body = util.fetchConfigBody(
      s3,
      process.env['S3_BUCKET'] || '',
      process.env['S3_BUCKET_KEY'] || ''
    );
    const matchers: IMinimatch[] = util.getMatchers(yaml.safeLoad(body));

    const token: string = core.getInput('github-token');
    const client: any = github.getOctokit(token, {log: console})

    const changedFiles = await util.getChangedFiles(client, prNumber);
    for (const changedFile of changedFiles) {
      if (util.isMatch(changedFile, matchers)) {
        result = true;
        break;
      }
    }

    core.setOutput('result', result)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
