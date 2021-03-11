<p align="center">
  <a href="https://github.com/actions/typescript-action/actions"><img alt="typescript-action status" src="https://github.com/actions/typescript-action/workflows/build-test/badge.svg"></a>
</p>

# PR Changed Files Matcher
A GitHub Actions component to check if a file changed by PR matches an expected file.

## Usage

### Create `expected_files.yml`
Defines a list of files to match. The file format is yaml. (File name is optional)
In the current version, only S3 is assumed to be the location for the definition file.

e.g.
```
- lib/hoge.ts
- lib/**/*
- src/*.ts
```

### Create Workflow

```yml
name: 'pr-changed-files-matcher-example'
on:
  pull_request:
    types:
      - opened
      - edited

jobs:
  pr:
    runs-on: ubuntu-latest
    steps:
      - id: step1
        uses: fukuiretu/actions-pr-changed-files-matcher@main
        with:
          github-token: "${{ secrets.GITHUB_TOKEN }}"
          s3-bucket: "your-bucket-name"
          s3-key-prefix: "path-to-object/expected_files-"
          pr-num: "your pr num"
        env:
          AWS_ACCESS_KEY_ID: "${{ secrets.AWS_ACCESS_KEY_ID }}"
          AWS_SECRET_ACCESS_KEY: "${{ secrets.AWS_SECRET_ACCESS_KEY }}"
          AWS_DEFAULT_REGION: "${{ secrets.AWS_DEFAULT_REGION }}"
      - id: step2
        run: |
          echo "pr-changed-files-matcher result: ${{ steps.step1.outputs.result }}"
```

_Note: This grants access to the `GITHUB_TOKEN` so the action can make calls to GitHub's rest API_

#### Inputs

Various inputs are defined in [`action.yml`](action.yml) to let you configure the labeler:

| Name | Description | Default |
| - | - | - |
| `github-token` | The GITHUB_TOKEN secret | N/A |
| `s3-bucket` | Name of the S3 bucket where the expected file is located. | N/A  |
| `s3-key-prefix` |  The prefix of the expected file.  **if more than one is applicable, the latest one is used.**  | N/A
| `pr-num` | Your pull request number  | N/A

##### ENV

Not required if you use [self-hosted runner](https://docs.github.com/en/actions/hosting-your-own-runners/about-self-hosted-runners) and run on an EC2 instance with the appropriate IAM.

| Name | Description | Default |
| - | - | - |
| `AWS_ACCESS_KEY_ID` | Access Key with Get permission to S3 | N/A |
| `AWS_SECRET_ACCESS_KEY` | Access Seacret with Get permission to S3 | N/A  |
| `AWS_DEFAULT_REGION` | Region where the specified S3 bucket is located  | ap-northeast-1
