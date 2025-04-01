project.prd.md

Product Requirements Document (PRD): Task Management WebApp (Bolt + Supabase)
________________________________________
Product Name: TaskStream Target User: Individual users seeking efficient task management with support for concurrency, context-aware filtering, and future NLP integration.
________________________________________
1. Purpose
Design a modular, efficient, and extensible web application to manage tasks, track time (including concurrent tasks), and support advanced features such as energy tagging, location dependency, and context switching indicators. Built with Bolt.new for UI/NLP and Supabase for backend persistence.
________________________________________
2. Core Features
J. Projects and Grouped Task Management
Project Support (MVP)
•	Introduce a projects table as a first-class object in the system
•	Each project includes:
•	id: uuid
•	user_id: uuid
•	name: text
•	description: text
•	created_at: timestamptz
•	due_date: date
•	archived: boolean
•	Tasks may belong to a project via a new project_id field in the tasks table
•	Project-level features:
o	Group tasks by project in views
o	Aggregate task progress and time spent per project
o	Support for project-specific filters, dashboards, and summaries
o	Allow tagging of goals, notes, or milestones at the project level
•	Future Enhancements:
o	Project progress tracking and percent complete
o	Project timeline views (calendar or Gantt)
o	Shared or team-owned projects with role-based access
A. Task Creation & Storage
Task Lifecycle Glossary
Term	Meaning
status	'active', 'completed', 'archived' – represents lifecycle state
activity_state	'idle', 'in_progress', 'paused' – describes real-time engagement
is_evergreen	Persistent task that spawns repeated instances
recurring_type	Enum for automatic recurrence intervals
due_date	Soft/hard deadline, manually adjustable
Tagging Support
•	Users can add custom tags to each task for flexible grouping and filtering
•	Tags are stored in a new custom_tags: text[] field in the tasks table
•	Tags can be used for:
o	Search and filtering (e.g., "#deepwork", "#admin")
o	Visual markers in task cards
o	Organizational groupings without changing category or priority
•	The app will surface frequently used tags as suggestions when adding/editing tasks
•	Future enhancements:
o	Tag analytics in dashboard views
o	Color coding or pinning tags for quick access
Notes and File Attachments
•	Each task supports longform notes (markdown-style formatting allowed)
•	Tasks may include one or more file attachments via attachment_urls field
•	Attachments stored as public/private URLs (via Supabase Storage or external links)
•	Notes and attachments are shown in task detail views and editable from creation/edit form
•	Files may include:
o	Screenshots
o	Reference documents
o	External resource links
•	Future: support drag-and-drop upload and inline file previews
Due Date Support
•	Tasks may optionally include a due_date field to represent a soft or hard deadline
•	If a task has a due_date, the has_deadline flag is set to true
•	due_date is independent of recurring_type and may vary per instance
•	Useful for:
o	Filtering overdue tasks
o	Planning day/week views
o	Future: generating reminders or urgency prioritization
•	Due dates are cloned on recurring tasks but may be adjusted manually per instance
Evergreen Tasks and Templates
Task Cloning Support
•	Any task (not just evergreen) can be cloned from the task menu
•	Cloned task behavior:
o	A new task is created with a new UUID
o	All metadata fields are copied (title, description, tags, estimated time, etc.)
o	Time logs are not copied
o	A new field cloned_from_task_id stores the reference to the original task
•	Cloning is available from the UI ("Clone task" action)
•	Future enhancements:
o	Grouping or filtering by source task
o	View clone lineage or clone count
•	Evergreen tasks (is_evergreen: true) serve a dual role:
o	Persistent tasks used for routines, habits, or time tracking (e.g., “Daily Journal”)
o	Reusable templates to spawn new instances with pre-filled metadata
•	When used as a template:
o	The user can choose 'Use as Template' in the UI
o	A new task is created with a unique UUID and a reference to the original evergreen task in template_task_id
o	The new task inherits metadata such as title, description, tags, category, subtasks, etc.
•	Evergreen tasks are not included in the default task view
•	This merged model avoids duplication while maintaining clarity
•	Future: If team mode or shared template libraries become prominent, consider extracting templates into a separate table
•	Evergreen tasks (is_evergreen: true) serve both as:
o	Persistent, reusable tasks for routines, habits, and tracking
o	Template-like structures for recurring or patterned task creation
•	When an evergreen task is used to spawn a new instance:
o	A new task is created (with its own UUID)
o	It stores a reference to the original template in template_task_id
•	Evergreen tasks are not shown in the main active task views by default
•	Future enhancement: option to convert any task into a reusable template (or separate templates table if team/collaboration support is needed)
•	Manual task form with inputs for:
o	Title
o	Description
o	Category (1-4)
o	Subcategory (1-6)
o	Priority (1-3)
o	Estimated Time (1-5)
o	Recurring Type (1-5)
o	Exclusive Flag (boolean)
o	Evergreen Flag (boolean)
o	Location Dependency (L1-L3 as tags or enum)
o	Energy Requirement (E1-E3 as tags or enum)
o	Context Switching Cost (C1-C3 as tags or enum)
o	Additional Flags: is_blocked, is_waiting, is_shared, is_milestone, has_deadline
•	Optional parent task selection for subtasks
•	Store in Supabase using uuid as PK; store metadata in structured columns
B. Task Display & Management
Manual Sorting Outside "Next Up"
•	Manual drag-and-drop reordering is supported only within the "Next Up" zone (max 3 tasks)
•	All other tasks follow dynamic sort logic (priority, created date, etc.)
•	This avoids complexity with maintaining separate manual sort orders across filtered views
•	Users can still use filters + sorting controls to shape their view
•	Future enhancement: custom groupings or buckets with drag-and-drop sorting across groups
Filtering Logic
•	Users can filter tasks using multi-select or toggle-based controls:
o	Status: Active, Completed, Archived
o	Category/Subcategory
o	Priority (P1–P3)
o	Energy Level (E1–E3)
o	Location Tag (L1–L3)
o	Feature flags (Evergreen, Waiting, Shared, etc.)
o	Include/Exclude: Evergreen Tasks, Recurring Tasks
o	Activity State: In Progress, Paused, Idle
•	Filtering supports compound logic (e.g., show all active + high energy + non-evergreen tasks)
Sorting Logic
•	User can sort task lists by:
o	Manual drag order (manual_sort_order for "Next Up" zone)
o	Created date (asc/desc)
o	Estimated time
o	Priority level (P1–P3)
o	Energy requirement
o	Context cost
•	Sorting logic is separate from filtering and does not override visual priority in drag-based zones
Display & Interaction
•	Persistent view of the currently active task card at the top or pinned area of the interface, showing title and elapsed time since start
•	Ability to "star" or prioritize tasks by dragging and dropping them into a dedicated "Next Up" zone (max 3 tasks)
•	Drag-and-drop reordering of task cards to manually adjust priority or workflow order (visual notecard/post-it metaphor)
•	Task drag order is treated as execution priority, independent of the priority field
•	priority (P1–P3) is retained for metadata filtering and suggestion purposes
•	A manual_sort_order field will be stored for drag-and-drop sorting
•	Task list view supports:
o	Filtering by Status, Category, Priority, Location, Energy, Feature flags
o	Nested display for subtasks
o	Ability to edit/update/delete tasks
o	Option to include or exclude Evergreen and Recurring tasks
•	Start/Stop timer for tasks
•	One exclusive task timer allowed at a time
•	Multiple concurrent non-exclusive timers allowed
•	Track time logs with:
o	Task UUID
o	Start time
o	End time
o	Duration (computed)
o	Notes
o	Exclusive flag
D. Task Sessions and Aggregation
🛡️ Subtask depth is restricted to one level. Validation prevents subtasks from being created under other subtasks. 🧩 Subtasks marked repeat_with_parent: false will not be cloned with recurring parent tasks (future setting).
Project Relationship Behavior
•	Projects display all associated tasks automatically
•	Filters can be scoped to individual projects from sidebar or dashboard view
💡 Clarity Suggestion: Consider adding a last_session_ended_at field (denormalized) on the task table to improve filtering by "recently worked on." 💡 UX Reminder: Add a visual badge or tag for tasks that include both parent-level and subtask-level time logs to indicate mixed session types.
Time Log Editing Permissions
•	Users may edit or delete any time log at any time (manual or automatic)
•	Supports self-correction for tracking errors or retroactive logging
•	Editing is done through the task detail view:
o	Edit start/end times, duration, or notes
o	Log changes are validated to prevent overlap or invalid timestamps
•	Deleted logs are soft-deleted and remain queryable in the event_logs table
•	Manual logs are tagged for audit clarity, and future enhancements may include a change history for edited logs
•	No time-based restrictions (e.g., 24-hour window) or lifecycle locking (e.g., only editable while task is active)
•	Designed for solo self-reporting use where accuracy and flexibility are prioritized
Time Log Viewer Behavior
•	By default, each task will display only the total time spent (e.g., "Total time: 2h 45m")
•	Users may click a “View Sessions” toggle or expand icon to view a detailed list of time logs:
o	Each session displays: start_time, end_time, duration, and any user-entered notes
o	Manual entries are visually tagged (e.g., with a 📝 icon)
o	Logs are sorted by most recent first
•	This expandable interface ensures a clean and uncluttered task view while preserving access to log-level detail for auditing or reflection
•	Future enhancement: collapsed summary like "5 sessions • 3 manual • 2:45 total"
Subtask Completion Prompt
•	When all subtasks under a parent task are marked as 'completed', the system prompts the user with the option:
o	“All subtasks completed. Would you like to mark the parent task as complete?”
•	This preserves manual control while streamlining task closure
•	The prompt is shown only once per parent task unless new subtasks are added or existing ones are re-opened
•	The user can manually mark the parent task as complete at any time
•	This behavior ensures better clarity in reports and task hygiene without enforcing automatic status changes
Search and Query Behavior
•	Users can perform keyword searches across tasks using a basic full-text search bar
•	Search matches are case-insensitive and check the following fields:
o	title
o	description
o	custom_tags
o	notes
•	Search queries are combined with active filters (e.g., category, priority, energy)
•	Search field is optional and non-destructive (i.e., clearing the search resets view)
•	Future Enhancements:
o	Add structured query parsing (e.g., tag:deepwork priority:P1)
o	Integrate NLP to convert natural language input into structured filters (e.g., "tasks I can do at home that need low energy")
o	Support tsvector search index in Supabase for stemming/fuzzy matching
Multi-User Assignment and Shared Task Ownership
Task Visibility Levels
•	Each task includes a visibility field to control access:
o	'private': visible only to the creator
o	'shared': visible to assigned users via task_assignments
o	'public': visible to all users in a shared workspace (future enhancement)
•	Default behavior:
o	New tasks are 'private' unless explicitly shared or assigned
o	When a task is assigned to other users, visibility automatically becomes 'shared'
•	UI behavior:
o	Visibility indicator shown on task detail and list views
o	Users can set or update visibility when editing tasks
•	Future enhancements:
o	Enforcement of view/edit permissions based on role and visibility
o	Filters for "my private tasks" vs. "shared with me" vs. "team-wide"
•	Tasks can be assigned to one or more users through a dedicated task_assignments table
•	Each assignment includes:
o	task_id: ID of the shared task
o	user_id: ID of the user assigned to it
o	role: optional assignment role (e.g., owner, editor, viewer, assignee)
•	The task table retains:
o	user_id: original creator of the task
o	is_shared: flag to indicate whether the task is shared with others
•	Roles are soft-defined at this stage and may be used for UI-level filtering and optional permission control in future phases
•	Shared task behaviors:
o	Multiple users can appear in filter/search as assigned participants
o	Assignees may receive reminders or suggestions based on assignment
o	Shared tasks may appear in shared views, dashboards, or reports
•	Future enhancements:
o	Visibility control (visibility: private, shared, public)
o	Role enforcement (edit/view restrictions)
o	Team dashboards or ownership transfers
Task Linking and Reference Relationships
•	Tasks may optionally be linked to other tasks to express soft relationships beyond subtasks and templates
•	A separate task_links table enables flexible linking and future relationship types
•	Each link consists of:
o	from_task_id: the task initiating the reference
o	to_task_id: the task being referenced
o	link_type: defines the nature of the link (e.g., related, follows, duplicate, informs, dependent)
•	Initial behavior:
o	Links are for reference and organization only; no logic or gating behavior is enforced
o	Related tasks may be shown in task detail views
•	Future enhancements may include:
o	Enforced gating (e.g., prevent task start unless dependency is complete)
o	Visual graph view of linked tasks
o	Filtering by tasks linked to a specific project or theme
Reminder and Notification System
•	Reminders help surface important or time-sensitive tasks proactively
•	Types of reminders:
o	Due Date Reminder: triggered from due_date, calculated using a user-defined lead time (e.g., same day, 1 day before)
o	Waiting Task Reminder: recurring reminder after a user-defined interval for is_waiting tasks (e.g., every 3 days)
o	Blocked Task Reminder: reminder triggered when a blocker task is resolved (future enhancement)
o	Next Up Nudges: optional reminder if no task has been started in X minutes while a "Next Up" task is queued
•	Reminders may use a remind_at timestamp field in the tasks table for system scheduling
•	All reminders are local-only for MVP (e.g., surface in Bolt UI or app banner)
•	Future Enhancements:
o	Add notification options (push/email)
o	Add customizable default reminder rules in settings
Recurring Task Logic
•	Tasks may be flagged with a recurring_type value to indicate recurrence pattern:
o	R1: Daily
o	R2: Weekly
o	R3: Monthly
o	R4: Quarterly
o	R5: Annually
o	R6: User-defined (custom number of days between repetitions)
•	When a recurring task is completed:
o	A new task instance is automatically generated at the appropriate interval (e.g., next day for R1)
o	The new instance:
	Gets a fresh UUID
	Inherits all relevant metadata (e.g., title, description, category, estimated_time, priority, subtasks)
	Stores a reference to the original task in template_task_id
o	Subtasks are also cloned by default
	Each subtask gets a new UUID
	Status is reset to default (active, idle)
	Time logs and activity state are not carried over
	Estimated time, due date, and metadata are retained
•	Recurring tasks are treated independently in analytics and history (each instance maintains its own time logs)
•	Users may adjust the due date of the cloned instance independently from the recurrence pattern
•	Future setting may allow custom rule builder for recurrence
•	Future enhancement: add a flag per subtask for selective cloning (e.g., repeat_with_parent: false)
•	Tasks may be flagged with a recurring_type value to indicate recurrence pattern:
o	R1: Daily
o	R2: Weekly
o	R3: Monthly
o	R4: Quarterly
o	R5: Annually
o	R6: User-defined (custom number of days between repetitions)
•	When a recurring task is completed:
o	A new task instance is automatically generated at the appropriate interval (e.g., next day for R1)
o	The new instance:
	Gets a fresh UUID
	Inherits all relevant metadata (e.g., title, description, category, estimated_time, priority, subtasks)
	Stores a reference to the original task in template_task_id
o	Subtasks are also cloned unless otherwise specified
•	Recurring tasks are treated independently in analytics and history (each instance maintains its own time logs)
•	Users may adjust the due date of the cloned instance independently from the recurrence pattern
•	Future setting may allow custom rule builder for recurrence
Blocked vs. Waiting Task Flags
•	Blocked Tasks (is_blocked: true):
o	Indicates the task cannot currently proceed due to an unmet prerequisite (e.g., waiting on another internal task or deliverable)
o	UI behavior:
	Card appears visually dimmed or marked as blocked
	Timer start is disabled unless manually overridden
	User can remove the blocked flag when the task becomes unblocked
•	Waiting Tasks (is_waiting: true):
o	Indicates the task is waiting on someone or something external, but could resume once unblocked
o	Common for follow-ups, approvals, or external inputs (e.g., "waiting on reply from client")
o	UI behavior:
	Card displays an icon or indicator for 'waiting'
	Remains accessible and can still be started if desired
•	Both flags are filterable and visible in task metadata
•	Future Enhancements:
o	Add optional blocked_by_task_id field for structured dependencies
o	Add waiting_on text field (e.g., "Waiting on Jane")
o	Notification/reminder system for long-standing blocked or waiting tasks
Interruption Logging & Context Switching
•	Interruption events are logged automatically when a user switches away from an in-progress task
•	Each interruption log includes:
o	from_task_id: task being interrupted
o	to_task_id: task switched to (nullable if none)
o	timestamp: when the interruption occurred
o	Optional tag or reason (to be supported in future enhancement)
•	Interruption logs are used to analyze context switching patterns and productivity losses
•	No prompts shown to the user initially (low-friction, passive collection)
•	Future UI features:
o	Manual "Log Interruption" button with tagging options (e.g., "Phone call", "Slack message")
o	Context switch heatmaps and reports in analytics
Archival Lifecycle and Visibility
•	Completed tasks can be archived to reduce clutter
•	Archived tasks are hidden from main views by default but remain fully queryable for:
o	Time logs
o	Historical summaries
o	Daily, weekly, or custom reports
•	Archiving does not affect time_logs or reporting queries unless explicitly filtered
•	Archival can be manual or automatic:
o	Default: auto-archive tasks X days after completion (default: 30)
o	User-configurable in settings via archived_after_days
o	Users can manually archive or restore tasks
•	Archived tasks are preserved with full metadata, UID, and time log links
•	Each task includes an estimated_time_minutes field to capture how long the user believes the task will take (in minutes or hours)
•	If a task has subtasks, the parent’s estimated time is automatically calculated as the sum of its subtasks’ estimated times
•	Estimated time is used for filtering, sorting, planning views, and (eventually) AI suggestions
•	Future enhancement: allow system or LLM to predict estimated_time_minutes based on task metadata, historical patterns, or similar tasks
•	Tasks support one level of subtasks only
•	Each subtask has its own time logs
•	Parent tasks may also have their own direct time logs
•	Time aggregation behavior:
o	Parent task total time = sum of its own time logs + all of its subtasks' time logs
o	Subtasks do not aggregate recursively beyond one level
o	Time from both completed and active subtasks is included in the parent's total
•	Future enhancement (optional): allow configuration to only roll up time from completed subtasks
•	Tasks have two separate state indicators:
o	status: lifecycle state of the task — 'active', 'completed', 'archived'
o	activity_state: current engagement — 'idle', 'in_progress', 'paused'
•	Default for new tasks:
o	status: 'active'
o	activity_state: 'idle'
•	Mark tasks as "in progress" when a user starts them
•	Automatically change to "paused" or "incomplete" if the session ends without completion
•	Record unique work sessions in the time_logs table
•	Aggregate session data per task:
o	Total time spent
o	List of individual sessions with timestamps and durations
•	For subtasks:
o	Aggregate session data per subtask
o	Sum all subtask times under the parent task for holistic reporting
Dual Time Aggregation Model (Raw vs. Net)
•	Raw Total: Sum of all duration values across time logs (e.g., 6 hrs childcare + 2 hrs taxes = 8 hrs)
•	Net Time: Deduplicated actual time worked (e.g., if childcare overlapped with taxes, report only 6 hrs total)
•	Use exclusive flag to help identify overlapping blocks
•	Present both values in reports:
o	Task-level views show Raw Total
o	Daily/weekly dashboards can include Net Time to reflect actual unique time spent
Example:
•	Childcare: 1–7 PM (6 hrs, non-exclusive)
•	Taxes: 3–5 PM (2 hrs, exclusive)
•	Childcare task will show 6 hrs total
•	Taxes will show 2 hrs total
•	Net time for the day: 6 hrs (3–5 PM double-counting normalized)
•	Tasks have two separate state indicators:
o	status: lifecycle state of the task — 'active', 'completed', 'archived'
o	activity_state: current engagement — 'idle', 'in_progress', 'paused'
•	Default for new tasks:
o	status: 'active'
o	activity_state: 'idle'
•	Mark tasks as "in progress" when a user starts them
•	Automatically change to "paused" or "incomplete" if the session ends without completion
•	Record unique work sessions in the time_logs table
•	Aggregate session data per task:
o	Total time spent
o	List of individual sessions with timestamps and durations
•	For subtasks:
o	Aggregate session data per subtask
o	Sum all subtask times under the parent task for holistic reporting
•	User interface updates:
o	Display total time next to each task in list view
o	Expandable section to view detailed session breakdown per task or subtask
E. UID Simplification
•	Use uuid for identity and joins
•	Avoid encoding metadata in UID strings
F. JSONB Flexibility
•	Include features_json column in tasks to:
o	Store tags, NLP-extracted data, historical UID versions
o	Enable schema-free expansion of features
G. Future NLP Integration
Re-parse Option
•	Users may select "Re-parse with LLM" if a parsed task is missing expected metadata
•	The original input and NLP result are preserved in features_json
•	Re-parses are logged as nlp_parse_retry in event_logs
Event Logging for NLP and UX Feedback
•	The app logs structured events related to NLP parsing and UI interaction to event_logs
•	Logged events may include:
o	nlp_parse_attempt
o	nlp_parse_success
o	nlp_parse_failed
o	nlp_corrected (with fields that were manually changed)
o	task_created, filter_applied, timer_started, etc.
•	Each log captures:
o	user_id
o	event_type
o	task_id (if applicable)
o	timestamp
o	metadata field for structured payloads
•	This enables tracking of:
o	NLP performance across LLMs
o	User interaction patterns (e.g., top filters used)
o	Behavior-based feature design decisions
LLM Integration Strategy
•	Task NLP parsing will be handled by a pluggable LLM model (default: OpenAI GPT-4-Turbo)
•	Greg may configure or experiment with alternate models (e.g., Claude, Gemini, Mistral)
•	API integration will be modular to allow model switching and testing
•	Prompt structure will map user input into structured task metadata
•	NLP response must include:
o	title
o	category / subcategory
o	optional: priority, time estimate, tags, recurrence, notes, and flags
•	NLP parsing behavior:
o	Input is sent synchronously during task creation
o	Output pre-fills task_form for review
o	Original input and parsed metadata stored in features_json
•	Fallbacks:
o	If NLP fails, user receives default blank task form
o	Retry or manual entry supported
•	Future Enhancements:
o	Multiple LLM performance comparison logs
o	NLP model-specific analytics for accuracy
o	Prompt tuning system to iterate based on field-by-field corrections
NLP Feedback and Correction Loop
•	NLP-generated tasks populate the task_form automatically with parsed metadata
•	Users must confirm or edit before submission (no automatic saves)
•	Parsed metadata includes:
o	Title, description, category, priority, etc.
o	Flags like energy level, exclusive, deadline, etc.
•	Original input text and NLP-parsed result are stored in features_json
•	Future enhancement:
o	Store NLP corrections (e.g., "original priority was P1, user changed to P2")
o	Use this for prompt tuning, pattern analysis, and improving NLP accuracy
o	Allow user to flag bad parses or request a re-parse
H. UID Generator (Display/Training Use Only)
•	While UUIDs are used as primary identifiers, a human-readable UID generator may still be retained for:
o	Future NLP pattern matching and training references
o	Display in logs, exports, or user summaries (e.g., 2.1.2403-001:X1P1)
o	Legacy debugging or audit trails
o	Evergreen task version tracking or instance grouping
•	If used, this display_uid will:
o	Be stored in a non-critical column (e.g., display_uid or inside features_json)
o	Be generated from structured metadata
o	Never be relied on for uniqueness, logic, or foreign key relations
o	Optionally be regenerated from source metadata
•	NLP interface to parse task text into structured form
•	Populate task_form automatically with parsed metadata
•	Seamlessly integrate with existing task creation flow
________________________________________
3. Supabase Schema Overview
event_logs Table
💡 Suggested event_type values: task_created, task_archived, nlp_parse_success, nlp_corrected, manual_log_created, time_log_edited, nlp_parse_retry
id: uuid()
user_id: uuid()
event_type: text // e.g., 'task_created', 'filter_applied', 'nlp_corrected', 'nlp_parse_failed'
task_id: uuid // nullable
timestamp: timestamptz
metadata: jsonb // optional extra details
Used to record app interactions for analytics, debugging, and feature improvement feedback.
task_assignments Table
id: uuid()
task_id: uuid()
user_id: uuid()
role: text // Optional: 'owner', 'editor', 'viewer', 'assignee'
created_at: timestamptz
Used to support multi-user task assignment and collaborative task ownership.
task_links Table
id: uuid()
from_task_id: uuid()
to_task_id: uuid()
link_type: text // e.g., 'related', 'dependent', 'duplicate', 'follows'
created_at: timestamptz
Used for representing soft relationships between tasks.
interruptions Table
id: uuid()
user_id: uuid()
from_task_id: uuid
to_task_id: uuid // Nullable if no new task is selected
interrupted_at: timestamptz
tag: text // Optional (e.g., 'Communication', 'Distraction')
notes: text // Optional
Used for context switching analysis, reporting interruptions, and informing productivity metrics.
tasks Table
💡 Note: Consider adding a modified_at: timestamptz field for better visibility into task updates in audit logs or UI indicators. 💡 Note: features_json should document all field overrides (e.g., LLM-generated vs. user-corrected values) for fine-grained analytics and prompt tuning.
...
project_id: uuid // Optional — references the project the task belongs to
...
...
is_deleted: boolean // Soft delete flag for hiding tasks without full erasure
...
...
cloned_from_task_id: uuid // Nullable — points to original task if cloned
...
...
visibility: text // 'private', 'shared', or 'public' (default: 'private')
...
...
custom_tags: text[] // Optional array of user-defined tags (e.g., ['deep work', 'admin'])
...
...
notes: text // Optional longform notes or rich markdown description
attachment_urls: text[] // Optional array of file URLs (stored or linked externally)
...
...
remind_at: timestamptz // Optional timestamp for reminder logic
...
...
due_date: date // Optional due date or deadline for the task
...
Includes metadata for user-defined and programmatic sorting. Supports filtering of repeating or evergreen tasks through dedicated fields. Supports multi-user use by associating each task with a specific user.
Includes metadata for user-defined and programmatic sorting.
id: uuid() // Primary Key
user_id: uuid() // References the user who owns this task
title: text
description: text
created_at: timestamptz
status: text // 'active', 'completed', 'archived'
category: int
subcategory: int
priority: int
estimated_time_minutes: int // Estimated time to complete the task, in minutes
recurring_type: int
is_exclusive: boolean
is_evergreen: boolean
is_blocked: boolean
is_waiting: boolean
is_shared: boolean
is_milestone: boolean
has_deadline: boolean
energy_level: int // E1-E3
location_tag: int // L1-L3
context_cost: int // C1-C3
parent_task_id: uuid
subtask_level: int
activity_state: text // 'idle', 'in_progress', 'paused'
manual_sort_order: int // Drag-and-drop order within 'Next Up' or other zones
template_task_id: uuid // Optional: links to original recurring task template
features_json: jsonb
daily_summary Table
💡 Clarification: net_total_seconds is deduplicated per user, not per task. Overlapping logs from separate tasks (e.g., exclusive + non-exclusive) are resolved to reflect true unique time worked.
Stores daily time aggregation data per user.
id: uuid()
user_id: uuid()
date: date
raw_total_seconds: int
net_total_seconds: int
time_by_category: jsonb // e.g., {"1": 3600, "2": 5400}
time_by_energy: jsonb // e.g., {"E1": 1800, "E3": 7200}
time_by_context_cost: jsonb
num_tasks_worked_on: int
most_common_category: int
notes: text // Optional: system or user notes for the day
Generated nightly or on-demand by server logic, used for dashboards and performance summaries.
________________________________________
time_logs Table
💡 Note: Consider adding created_by and modified_by fields to support future multi-user setups and audit logging. 💡 Note: Manual entries should include a is_manual: boolean field or be flagged in notes or features_json to enable filtering in analytics and visual indicators in UI.
Each log is linked to a user via the associated task and supports multi-user expansion.
id: uuid()
task_id: uuid()
start_time: timestamptz
end_time: timestamptz
duration: int
notes: text
exclusive: Boolean

**3.1 Database Performance & Scalability**

**UUID Implementation Strategy**
- All tables use UUIDs as primary keys for distributed scalability
- Implement B-tree indexes on all foreign key columns (task_id, user_id, etc.)
- Create composite indexes for common filter combinations:
  - (user_id, status, priority) for task filtering
  - (user_id, date) for time log queries
  - (task_id, start_time) for session analysis

**JSONB Strategy**
- features_json schema:
  - nlp_metadata: Original input and parsed result
  - user_corrections: Fields manually changed after NLP parsing
  - display_preferences: UI-specific settings
  - version_history: Track field changes over time
- Create partial indexes on common JSONB queries
- Extract high-frequency query fields to dedicated columns

**Denormalization & Data Integrity**
- Use Supabase triggers to maintain denormalized fields (e.g., last_session_ended_at)
- Implement database-level constraints for data validation
- Include modified_at timestamp on all tables for change tracking
- Add version field for optimistic concurrency control
________________________________________
4. Non-Functional Requirements
**Offline Mode with Progressive Enhancement**
- **Phase 1: Basic Offline Viewing**
  - Cache most recent task list and "Next Up" zone
  - Store in IndexedDB with expiration policy
  - Display "offline mode" indicator

- **Phase 2: Offline Operations**
  - Implement client-side command queue in IndexedDB
  - Generate client-side UUIDs with device prefix to prevent conflicts
  - Track all changes with timestamps and version numbers
  - Allow task creation, updates, and time tracking while offline

- **Phase 3: Synchronization & Conflict Resolution**
  - Implement two-way sync on reconnection
  - Conflict resolution strategy:
    - Server wins for shared resources
    - Last-write-wins with version checks for personal tasks
    - Merge strategy for non-conflicting field updates
    - Alert user when manual resolution is needed
  - Provide sync status indicators and history

- **Phase 4: Resilient Time Tracking**
  - Use Web Workers for background timer operation
  - Persist timer state across page refreshes
  - Implement periodic state saving to survive browser crashes

Installable as a Progressive Web App (PWA)
o	When added to iOS or Android homescreen, opens full-screen without browser UI (standalone mode)
o	Includes manifest.json and service worker for installability and offline fallback (limited scope for offline viewing or caching)
•	Mobile responsive
•	Modular Bolt component design (task_form, task_list, time_controls, etc.)
•	Data integrity via Supabase FK constraints
•	TypeScript usage in Bolt for type safety
•	Helpers for UID generation, task parsing, timer management

**4.1 Security Implementation**

**Row-Level Security (RLS)**
- Implement Supabase RLS policies on all tables:
  - tasks: (auth.uid() = user_id) OR id IN (SELECT task_id FROM task_assignments WHERE user_id = auth.uid())
  - time_logs: auth.uid() IN (SELECT user_id FROM tasks WHERE id = time_logs.task_id)
  - event_logs: auth.uid() = user_id
  - projects: (auth.uid() = user_id) OR id IN (SELECT project_id FROM project_members WHERE user_id = auth.uid())

**Authentication & Authorization**
- Use Supabase Auth for user authentication
- Implement role-based access for future multi-user features
- Store user preferences and settings in dedicated user_settings table

**Data Privacy**
- Implement visibility controls as described in "Task Visibility Levels"
- Add audit logging for sensitive operations
- Provide data export/deletion for user data ownership

**Enhanced Time Tracking Implementation**

**Timer Architecture**
- Implement timers using Web Workers for background operation
- Store timer state in localStorage for persistence across refreshes
- Sync timer events to server when online, queue when offline
- Support multiple concurrent timers (exclusive + non-exclusive)

**Time Zone Handling**
- Store all timestamps in UTC in the database
- Track user's timezone in user_settings table
- Convert times to local timezone for display
- Handle daylight saving transitions gracefully

**Timer States & Transitions**
- Running: actively tracking time
- Paused: temporarily stopped but resumable
- Completed: finished and logged
- Abandoned: stopped without completion

**Session Boundary Detection**
- Auto-pause after configurable idle time (default: 15 minutes)
- Prompt user on return: "Continue timer?" or "Log interruption?"
- Allow manual time entry for forgotten sessions
- Support retroactive logging with validation
________________________________________
5. Phased Development Plan

This outlines the planned stages for developing TaskStream, focusing on iterative delivery of core features.

| Phase | Focus                       | Key Deliverables                                                                                                      | Duration |
|-------|-----------------------------|-----------------------------------------------------------------------------------------------------------------------|----------|
| 1     | Foundation                  | Supabase setup, RLS policies, authentication, basic schema (tasks, users).                                          | 1 Week   |
| 2     | Core Task Management        | Task CRUD operations, basic UI (list view), task filtering/sorting MVP, initial state management (Zustand).         | 2 Weeks  |
| 3     | Timer v1: Single Task       | **See Detailed Plan Below**                                                                                           | 2 Weeks  |
| 4     | Projects & Organization     | **See Detailed Plan Below**                                                                                           | 2 Weeks  |
| 5     | Timer v2: Concurrency       | Support for multiple concurrent timers (exclusive/non-exclusive), timeline view of sessions.                       | 2 Weeks  |
| 6     | Offline Support & Sync      | Robust offline mode using IndexedDB, conflict resolution strategies (CRDTs or OT), background sync.                | 3 Weeks  |
| 7     | Advanced Filtering & Search | Full-text search (tsvector), saved filter views, advanced sorting options, natural language filtering (NLP v2).      | 2 Weeks  |
| 8     | Subtasks & Hierarchy        | Enhanced subtask management, visual hierarchy (indentation), dependency tracking (blocked/waiting).                 | 2 Weeks  |
| 9     | Reports & Analytics         | Dashboard with charts (time by category/project), daily/weekly summaries, data export options.                      | 3 Weeks  |
| 10    | NLP Enhancement & AI        | Improved NLP parsing accuracy, task prediction/suggestion based on history, smart scheduling recommendations.        | Ongoing  |

### Phase 3: Timer v1 Implementation Plan

**Primary Goals:**
*   Build a single-task timer with start/stop/pause/resume functionality.
*   Log time sessions to Supabase with accuracy and offline resilience.
*   Lay groundwork for future concurrency (Phase 5) and conflict resolution (Phase 6).
*   Address feedback on state management, security, and scalability.

**Implementation Steps:**

1.  **Timer Core Functionality**
    *   **Objective:** Reliable time tracking with session persistence.
    *   **Steps:**
        *   **State Machine Design:** Define timer states (idle, running, paused, completed, abandoned) using Zustand. Track `currentTaskId`, `startTime`, `elapsedTime`, `lastPausedTime`.
        *   **Web Worker Integration:** Offload timer logic to a Web Worker. Sync state to `localStorage` every 30 seconds for recovery.
        *   **Supabase Time Logs:** On stop, write to `time_logs` (task_id, start_time, end_time, duration, is_manual: false). Use optimistic updates.

2.  **Offline Resilience**
    *   **Objective:** Basic offline support for timer continuity.
    *   **Steps:**
        *   **Client-Side Command Queue:** Store unsynced logs in IndexedDB (`pending_sync` flag). Use hybrid UUIDs (`client:${deviceId}:${uuid}`).
        *   **Sync on Reconnect:** Retry failed syncs (exponential backoff). Merge duplicates using `task_id` and `start_time`.

3.  **Security & Data Integrity**
    *   **Objective:** Secure time logging and RLS compliance.
    *   **Steps:**
        *   **RLS Policies for `time_logs`:** Ensure users can only manage logs for tasks they own.
        *   **Triggers for Denormalization:** Auto-update `tasks.last_session_ended_at` via triggers.

4.  **Testing & Validation**
    *   **Objective:** Ensure robustness.
    *   **Steps:**
        *   **E2E Tests (Cypress):** Test start/pause/resume/stop, offline sync, concurrent edits simulation.
        *   **Integration Tests (MSW):** Mock Supabase endpoints, validate RLS and error handling.

5.  **UI/UX Enhancements**
    *   **Objective:** Intuitive controls and feedback.
    *   **Steps:**
        *   **Active Task Panel:** Persistent UI showing current task, elapsed time, controls. Visual states (color-coded borders).
        *   **Error Handling:** Toasts for sync failures, "Recover session?" prompt after crash.

**Timeline (2 Weeks):**
*   **Week 1:** Core Timer Logic + State (Zustand store, Web Worker, Supabase writes, RLS).
*   **Week 2:** Offline Sync + UI/Testing (IndexedDB queue, Cypress tests, active task panel, error toasts).

**Key Risks & Mitigations:**
*   **Timer Drift:** Sync with server time; use `performance.now()`.
*   **IndexedDB Quota:** Cap offline logs (e.g., 100); prune after sync.
*   **RLS Oversights:** Test with multiple users.

**Additional Considerations (Cross-Phase):**
*   **Edge Cases:** Handle browser closures (`beforeunload`), idle detection, short/long sessions.
*   **Error Handling:** Fallback if Web Worker fails, manual recovery UI for orphaned logs.
*   **Performance:** Batch `localStorage` writes, debounce Supabase writes, manage Web Worker memory.
*   **Security:** Validate task ownership before starting timers.
*   **UX:** Visual feedback (animations), navigation guards for running timers.
*   **Testing:** Test across time zones, sub-second precision, stress testing (simulate Phase 5).
*   **Future-Proofing:** Design Zustand for `timers[]` array, use reusable `useTimer(taskId)` hook, ensure `time_logs` schema includes `is_exclusive`.
*   **Accessibility:** Keyboard shortcuts, ARIA labels.
*   **Localization:** Format time based on locale.
*   **Analytics:** Log timer events, monitor sync failures.

### Phase 4: Projects & Organization Implementation Plan

**Primary Goals:**
*   Introduce projects as a first-class entity with task grouping and aggregation.
*   Enable project-specific views, filters, and dashboards.
*   Lay groundwork for future enhancements (shared projects, Gantt charts).

**Implementation Steps:**

1.  **Database Schema & Backend**
    *   **Objective:** Robust project-task relationships with security and performance.
    *   **Steps:**
        *   **Schema Design:** Create `projects` table (`id`, `user_id`, `name`, `description`, `created_at`, `due_date`, `archived`). Add `project_id` (nullable UUID, references `projects.id`) to `tasks` table.
        *   **Indexes:** Add indexes on `projects(user_id)` and `tasks(project_id)`. Use partial index on `projects(user_id)` WHERE `archived = false`.
        *   **RLS Policies:** Ensure users own their projects (`projects.user_id = auth.uid()`). Update `tasks` RLS to allow access if `tasks.user_id = auth.uid()` OR `tasks.project_id` is in user's projects.

2.  **API & Business Logic**
    *   **Objective:** Secure CRUD operations for projects and task associations.
    *   **Steps:**
        *   **Endpoints:** `POST /projects`, `GET /projects/{id}/tasks`, `PATCH /tasks/{id}/project`.
        *   **Validation:** Prevent assigning tasks to projects not owned by the user.
        *   **Aggregation:** Compute project progress (e.g., completed/total tasks) via PostgreSQL triggers or backend logic.

3.  **Frontend Implementation**
    *   **Objective:** Intuitive project management and task grouping.
    *   **Steps:**
        *   **Project Dashboard:** Grid view of project cards (name, due date, progress, task count). Actions: Edit, Archive, Delete.
        *   **Task Grouping:** Project filter dropdown. Optional visual hierarchy in sidebar.
        *   **UI Components:** Project creation/edit modal. Optional drag-and-drop tasks into projects.

4.  **Security & Permissions**
    *   **Objective:** Prevent data leaks and unauthorized access.
    *   **Steps:**
        *   **Ownership Checks:** Validate `project_id` ownership in all relevant API calls.
        *   **Audit Logs:** Log project create/update events.

5.  **Performance Optimization**
    *   **Objective:** Handle large projects without latency.
    *   **Steps:**
        *   **Pagination:** Fetch tasks within projects in pages (e.g., 50 per page).
        *   **Caching:** Cache project metadata in Zustand.
        *   **Lazy Loading:** Load project details on demand.

**Timeline (2 Weeks):**
*   **Week 1:** Schema, API, Basic UI (Projects table, CRUD endpoints, dashboard UI).
*   **Week 2:** Security, Testing, Polish (RLS policies, aggregation, pagination, E2E tests).

**Key Risks & Mitigations:**
*   **Slow Queries:** Optimize with indexes, consider materialized views for aggregates.
*   **UI Overload:** Use virtualized lists, lazy loading.
*   **RLS Leaks:** Rigorously test with multiple accounts.

**Additional Considerations (Cross-Phase):**
*   **Backward Compatibility:** Handle tasks with `project_id = NULL` gracefully ("Uncategorized"). Update timer dashboards to aggregate by project.
*   **Forward Compatibility:** Add nullable `team_id`, `visibility` columns to `projects` now for Phase 7 (Shared Projects). Design `project_members` table structure preemptively. Ensure project metadata aids Phase 5 (Timeline Views).
*   **Performance:** Create `project_analytics` materialized view. Add composite indexes (`tasks(project_id, status)`, `projects(user_id, archived)`).
*   **UX Consistency:** Integrate projects sidebar/filters cohesively. Update onboarding. Provide clear error messages (e.g., deleting projects with tasks).
*   **Testing:** Include regression tests for Phases 1-3. Stress test large projects. Test RLS with multi-user scenarios.
*   **Documentation:** Update API specs, user guides for project management.

{{ ... }}
