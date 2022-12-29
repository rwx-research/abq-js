export interface Test {
  type: 'test'
  id: string
  tags: string[]
  meta: Record<string, any>
}

export interface Group {
  type: 'group'
  name: string
  tags: string[]
  meta: Record<string, any>
  members: ManifestMember[]
}

export type ManifestMember = Group | Test

export interface ManifestMessage {
  manifest: {
    members: ManifestMember[]
    init_meta: Record<string, any>
  }
}

export interface TestCaseMessage {
  test_case: {
    id: string
    meta: Record<string, any>
  }
}

export type Milliseconds = number

export type TestResultStatus =
  | 'failure'
  | 'success'
  | 'error'
  | 'pending'
  | 'skipped'

export interface TestResult {
  status: TestResultStatus
  id: string
  display_name: string
  output: string | null | undefined
  runtime: Milliseconds
  meta: Record<string, any>
}

export interface TestResultMessage {
  test_result: TestResult
}

export interface NativeRunnerSpecification {
  type: 'abq_native_runner_specification'
  name: string
  version: string
  test_framework: string
  test_framework_version: string
  language: string
  language_version: string
  host: string
}

export interface ProtocolVersion {
  type: 'abq_protocol_version'
  major: number
  minor: number
}

export interface AbqNativeRunnerSpawnedMessage {
  type: 'abq_native_runner_spawned'
  protocol_version: ProtocolVersion
  runner_specification: NativeRunnerSpecification
}

export interface InitMessage {
  init_meta: Record<string, any>
  fast_exit: boolean
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface InitSuccessMessage {
}
