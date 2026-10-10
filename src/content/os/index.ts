/** Operating-systems truth for CPET181 (#539): scheduling (Ch4) and contiguous allocation (Ch2). Pure, no dependency. */
export { schedule, type Policy, type SchedJob, type ScheduleOptions, type Segment, type JobResult, type Schedule } from "./schedule";
export { allocate, place, release, compact, memoryFrom, pickRegion, summarise, type Fit, type Scheme, type Region, type MemJob, type AllocOptions, type Placement, type Waiting, type Summary, type Allocation, type Relocation } from "./allocate";
