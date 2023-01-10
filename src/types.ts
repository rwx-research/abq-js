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

export interface ManifestSuccessMessage {
  type: 'manifest_success'
  manifest: {
    members: ManifestMember[]
    init_meta: Record<string, any>
  }
  other_errors?: OutOfBandError[]
}

export interface ManifestFailureMessage {
  type: 'manifest_failure'
  error: OutOfBandError
  // Any other errors that were observed while generating the manifest.
  other_errors?: OutOfBandError[]
}

export interface TestCaseMessage {
  test_case: {
    id: string
    meta: Record<string, any>
  }
}

export type Nanoseconds = number

export interface TestResultFailure {
  type: 'failure'
  exception?: string
  backtrace?: string[]
}

export interface TestResultError {
  type: 'error'
  exception?: string
  backtrace?: string[]
}

export type TestResultStatus =
  | TestResultFailure
  | TestResultError
  | { type: 'success' }
  | { type: 'pending' }
  | { type: 'skipped' }
  | { type: 'todo' }
  | { type: 'timed_out' }

export interface Location {
  file: string
  /** A 1-indexed line number. */
  line?: number
  /** A 1-indexed column number. */
  column?: number
}

export interface TestResult {
  status: TestResultStatus
  // An opaque ID of the test for use by a native test runner
  // to identify a test for its operation.
  // Ideally unique to this run. This now takes on the same role as
  // https://github.com/rwx-research/test-results-schema/blob/main/v1/t
  id: string
  display_name: string

  // A human-consumable message regarding the outcome of the test.
  output: string | null | undefined
  runtime: Nanoseconds
  meta: Record<string, any>

  location?: Location

  started_at?: string // ISO 8601 date-time
  finished_at?: string // ISO 8601 date-time

  lineage?: string[]

  // Past attempts of this test (primarily useful for intra-run retries).
  // The first attempt should be first, the most recent attempt should be last.
  //
  // This may be populated by both native test runners,
  // and ABQ if/when ABQ supports test retries.
  past_attempts?: TestResult[]

  // Other errors, outside of this test, that occurred before or after its execution.
  other_errors?: OutOfBandError[]
}

export interface OutOfBandError {
  message: string
  backtrace?: string[]
  exception?: string
  location?: Location
  meta?: Record<string, any>
}

export type TestResultMessage =
  | SingleTestResultMessage
  | MultipleTestResultsMessage
  | IncrementalTestResultMessage

export interface SingleTestResultMessage {
  test_result: TestResult
}

export interface MultipleTestResultsMessage {
  test_results: TestResult[]
}

export type IncrementalTestResultMessage =
  | IncrementalTestResultStep
  | IncrementalTestResultDone

export interface IncrementalTestResultStep {
  type: 'incremental_result'
  one_test_result: TestResult
}

export interface IncrementalTestResultDone {
  type: 'incremental_result_done'
  last_test_result?: TestResult
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
export interface InitSuccessMessage {}
