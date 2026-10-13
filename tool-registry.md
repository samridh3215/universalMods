# Available tool registry (abridged descriptions)

Snapshot from this session. Every callable tool is listed with its exact registered name and an abridged registry description.

## 1. `apply_patch`

The \`apply_patch\` tool can be used to edit files. This is a FREEFORM tool, so do not wrap the patch in JSON. 

## 2. `create_goal`

Create a goal only when explicitly requested by the user or system/developer instructions; do not infer goals from ordinary tasks. Set token_budget only when an explicit token budget is requested. Fails if an unfinished 

## 3. `exec_command`

Runs a command in a PTY, returning output or a session ID for ongoing interaction. 

## 4. `get_goal`

Get the current goal for this thread, including status, budgets, token and elapsed-time usage, and remaining token budget. 

## 5. `image_gen__imagegen`

Tools in the image_gen namespace. The \`image_gen.imagegen\` tool enables image generation from descriptions and editing of existing images based on specific instructions. Use it when: - The user requests an image based on

## 6. `list_mcp_resource_templates`

Lists resource templates provided by MCP servers. Parameterized resource templates allow servers to share data that takes parameters and provides context to language models, such as files, database schemas, or applicatio

## 7. `list_mcp_resources`

Lists resources provided by MCP servers. Resources allow servers to share data that provides context to language models, such as files, database schemas, or application-specific information. Prefer resources over web sea

## 8. `mcp__codex_apps__b_a__draw_sketches__b_a_draw_sketc_1253b16a43c9`

Draw and visualize ideas INTERNAL ONLY - DO NOT CALL. This tool is called automatically by the widget. Use open_drawing_app instead. This tool is part of plugin \`B&A: Draw Sketches\`. 

## 9. `mcp__codex_apps__b_a__draw_sketches__b_a_draw_sketc_2f33b843ba6a`

Draw and visualize ideas INTERNAL ONLY - DO NOT CALL. This tool is called automatically by the widget. Use open_drawing_app instead. This tool is part of plugin \`B&A: Draw Sketches\`. 

## 10. `mcp__codex_apps__b_a__draw_sketches__b_a_draw_sketc_4f5b9fcb420d`

Draw and visualize ideas INTERNAL ONLY - DO NOT CALL. This tool is called automatically by the widget. Use open_drawing_app instead. This tool is part of plugin \`B&A: Draw Sketches\`. 

## 11. `mcp__codex_apps__b_a__draw_sketches__b_a_draw_sketc_78bc2695b1bd`

Draw and visualize ideas Open a whiteboard canvas for free-form drawing. Create sketches, diagrams, notes, and visual ideas. Draw freely with shapes, lines, text and save your work. Perfect for brainstorming, wireframing

## 12. `mcp__codex_apps__b_a__draw_sketches__b_a_draw_sketc_e1d3116973f3`

Draw and visualize ideas INTERNAL ONLY - DO NOT CALL. This tool is called automatically by the widget. Use open_drawing_app instead. This tool is part of plugin \`B&A: Draw Sketches\`. 

## 13. `mcp__codex_apps__b_a__draw_sketches__b_a_draw_sketches_draw_load`

Draw and visualize ideas INTERNAL ONLY - DO NOT CALL. This tool is called automatically by the widget. Use open_drawing_app instead. This tool is part of plugin \`B&A: Draw Sketches\`. 

## 14. `mcp__codex_apps__b_a__draw_sketches__b_a_draw_sketches_draw_save`

Draw and visualize ideas INTERNAL ONLY - DO NOT CALL. This tool is called automatically by the widget. Use open_drawing_app instead. This tool is part of plugin \`B&A: Draw Sketches\`. 

## 15. `mcp__codex_apps__chessy_end_game`

Enables turn-based, single-player chess games where the user always plays White against an AI playing Black. Use it to start, view, continue, and end chess games, validating and applying user moves and generating the AI’

## 16. `mcp__codex_apps__chessy_model_move`

Enables turn-based, single-player chess games where the user always plays White against an AI playing Black. Use it to start, view, continue, and end chess games, validating and applying user moves and generating the AI’

## 17. `mcp__codex_apps__chessy_show_game`

Enables turn-based, single-player chess games where the user always plays White against an AI playing Black. Use it to start, view, continue, and end chess games, validating and applying user moves and generating the AI’

## 18. `mcp__codex_apps__chessy_start_game`

Enables turn-based, single-player chess games where the user always plays White against an AI playing Black. Use it to start, view, continue, and end chess games, validating and applying user moves and generating the AI’

## 19. `mcp__codex_apps__chessy_user_move`

Enables turn-based, single-player chess games where the user always plays White against an AI playing Black. Use it to start, view, continue, and end chess games, validating and applying user moves and generating the AI’

## 20. `mcp__codex_apps__codex_document_control_execute_d_7437ad2e4ffa`

Use Codex Document Control to find connected document sessions, inspect the tools supported by a selected session, and execute one supported tool against that session. Call \`list_document_sessions\` first to choose the in

## 21. `mcp__codex_apps__codex_document_control_get_docum_83c7f0565c0f`

Use Codex Document Control to find connected document sessions, inspect the tools supported by a selected session, and execute one supported tool against that session. Call \`list_document_sessions\` first to choose the in

## 22. `mcp__codex_apps__codex_document_control_list_document_sessions`

Use Codex Document Control to find connected document sessions, inspect the tools supported by a selected session, and execute one supported tool against that session. Call \`list_document_sessions\` first to choose the in

## 23. `mcp__codex_apps__github_add_comment_to_issue`

Access repositories, issues, and pull requests. Required for some features such as Codex Create a top-level PR Conversation comment (Issue comment). This tool is part of plugin \`GitHub\`. 

## 24. `mcp__codex_apps__github_add_issue_assignees`

Access repositories, issues, and pull requests. Required for some features such as Codex Add assignees to an issue or pull request. Returns a normalized issue snapshot after the mutation. Docs: https://docs.github.com/en

## 25. `mcp__codex_apps__github_add_issue_labels`

Access repositories, issues, and pull requests. Required for some features such as Codex Add labels to an issue or pull request. Returns a normalized issue snapshot after the mutation. Docs: https://docs.github.com/en/re

## 26. `mcp__codex_apps__github_add_reaction_to_issue_comment`

Access repositories, issues, and pull requests. Required for some features such as Codex Add a reaction to an issue comment. This tool is part of plugin \`GitHub\`. 

## 27. `mcp__codex_apps__github_add_reaction_to_pr`

Access repositories, issues, and pull requests. Required for some features such as Codex Add a reaction to a GitHub pull request. This tool is part of plugin \`GitHub\`. 

## 28. `mcp__codex_apps__github_add_reaction_to_pr_review_comment`

Access repositories, issues, and pull requests. Required for some features such as Codex Add a reaction to a pull request review comment. This tool is part of plugin \`GitHub\`. 

## 29. `mcp__codex_apps__github_add_review_to_pr`

Access repositories, issues, and pull requests. Required for some features such as Codex Add a review to a GitHub pull request. review is required for REQUEST_CHANGES and COMMENT events. This tool is part of plugin \`GitH

## 30. `mcp__codex_apps__github_compare_commits`

Access repositories, issues, and pull requests. Required for some features such as Codex Compare two commits/refs and return per-file stats plus compare metadata. This is a thin wrapper around \`GithubPlugin.compare_commi

## 31. `mcp__codex_apps__github_convert_pull_request_to_draft`

Access repositories, issues, and pull requests. Required for some features such as Codex Convert an open pull request back to draft state. Returns the connector's normalized PR snapshot after the transition. Docs: https:

## 32. `mcp__codex_apps__github_create_blob`

Access repositories, issues, and pull requests. Required for some features such as Codex Create a blob in the repository and return its SHA. This tool is part of plugin \`GitHub\`. 

## 33. `mcp__codex_apps__github_create_branch`

Access repositories, issues, and pull requests. Required for some features such as Codex Create a new branch from exactly one existing commit SHA or base ref. This tool is part of plugin \`GitHub\`. 

## 34. `mcp__codex_apps__github_create_commit`

Access repositories, issues, and pull requests. Required for some features such as Codex Create a commit pointing to tree_sha with one or more parents. This tool is part of plugin \`GitHub\`. 

## 35. `mcp__codex_apps__github_create_file`

Access repositories, issues, and pull requests. Required for some features such as Codex Create a new UTF-8 text file through GitHub's contents API. Returns only the resulting commit SHA, not GitHub's full content/commit

## 36. `mcp__codex_apps__github_create_issue`

Access repositories, issues, and pull requests. Required for some features such as Codex Create a GitHub issue. Returns a normalized issue snapshot, not GitHub's raw REST payload. Docs: https://docs.github.com/en/rest/is

## 37. `mcp__codex_apps__github_create_pull_request`

Access repositories, issues, and pull requests. Required for some features such as Codex Open a pull request in the repository. Returns the connector's normalized PR snapshot, not the full REST response payload. Docs: ht

## 38. `mcp__codex_apps__github_create_tree`

Access repositories, issues, and pull requests. Required for some features such as Codex Create a tree object in the repository from the given elements. This tool is part of plugin \`GitHub\`. 

## 39. `mcp__codex_apps__github_delete_file`

Access repositories, issues, and pull requests. Required for some features such as Codex Delete a file through GitHub's contents API. Returns only the resulting commit SHA. Docs: https://docs.github.com/en/rest/repos/con

## 40. `mcp__codex_apps__github_dismiss_pull_request_review`

Access repositories, issues, and pull requests. Required for some features such as Codex Dismiss a submitted pull request review. Returns the normalized review snapshot after dismissal. Docs: https://docs.github.com/en/g

## 41. `mcp__codex_apps__github_download_user_content`

Access repositories, issues, and pull requests. Required for some features such as Codex Download a GitHub private user image attachment URL. Use this only for private-user-images.githubusercontent.com URLs, such as GitH

## 42. `mcp__codex_apps__github_download_workflow_artifact`

Access repositories, issues, and pull requests. Required for some features such as Codex Download a GitHub Actions workflow artifact ZIP archive. GitHub serves this endpoint through a temporary redirect; the underlying c

## 43. `mcp__codex_apps__github_enable_auto_merge`

Access repositories, issues, and pull requests. Required for some features such as Codex Enable auto-merge for a pull request. This wrapper infers the merge method from repository settings and returns only \`success\`. Doc

## 44. `mcp__codex_apps__github_fetch`

Access repositories, issues, and pull requests. Required for some features such as Codex Fetch approved public GitHub repository resources and repository files. Supports repositories, directories, code and issue search, 

## 45. `mcp__codex_apps__github_fetch_blob`

Access repositories, issues, and pull requests. Required for some features such as Codex Fetch blob content by SHA from the given repository. This tool is part of plugin \`GitHub\`. 

## 46. `mcp__codex_apps__github_fetch_commit`

Access repositories, issues, and pull requests. Required for some features such as Codex Fetch a commit with its metadata, diff, and canonical URL. This tool is part of plugin \`GitHub\`. 

## 47. `mcp__codex_apps__github_fetch_commit_workflow_runs`

Access repositories, issues, and pull requests. Required for some features such as Codex Fetch GitHub Actions workflow runs associated with a commit SHA. This wrapper currently filters to pull-request-triggered runs and 

## 48. `mcp__codex_apps__github_fetch_file`

Access repositories, issues, and pull requests. Required for some features such as Codex Fetch file content by repository path, using the default branch when ref is omitted. This tool is part of plugin \`GitHub\`. 

## 49. `mcp__codex_apps__github_fetch_issue`

Access repositories, issues, and pull requests. Required for some features such as Codex Fetch a GitHub issue. You must populate exactly one of \`repository_full_name\`, \`repository_id\`, or \`repository_url\` to select the i

## 50. `mcp__codex_apps__github_fetch_issue_comments`

Access repositories, issues, and pull requests. Required for some features such as Codex Fetch comments for a GitHub issue across all pages. This tool is part of plugin \`GitHub\`. 

## 51. `mcp__codex_apps__github_fetch_pr`

Access repositories, issues, and pull requests. Required for some features such as Codex Fetch a pull request with its diff, metadata, and optionally comments. This tool is part of plugin \`GitHub\`. 

## 52. `mcp__codex_apps__github_fetch_pr_comments`

Access repositories, issues, and pull requests. Required for some features such as Codex Fetch a merged PR discussion timeline. The returned list combines issue comments, inline review comments, and review submissions in

## 53. `mcp__codex_apps__github_fetch_pr_file_patch`

Access repositories, issues, and pull requests. Required for some features such as Codex Fetch the patch for one validated changed file in an accessible pull request. Call \`list_pr_changed_filenames\` first, then pass an 

## 54. `mcp__codex_apps__github_fetch_pr_patch`

Access repositories, issues, and pull requests. Required for some features such as Codex Fetch the patch for a GitHub pull request across all changed-file pages. This tool is part of plugin \`GitHub\`. 

## 55. `mcp__codex_apps__github_fetch_workflow_job_logs`

Access repositories, issues, and pull requests. Required for some features such as Codex Fetch decoded logs for a GitHub Actions workflow job. GitHub serves this endpoint through a temporary redirect; the underlying clie

## 56. `mcp__codex_apps__github_fetch_workflow_job_steps`

Access repositories, issues, and pull requests. Required for some features such as Codex Fetch steps for a GitHub Actions workflow job. Returns only step summaries, not the full job payload. Docs: https://docs.github.com

## 57. `mcp__codex_apps__github_fetch_workflow_run_artifacts`

Access repositories, issues, and pull requests. Required for some features such as Codex Fetch artifacts for a GitHub Actions workflow run. This wrapper returns the first page only. Docs: https://docs.github.com/en/rest/

## 58. `mcp__codex_apps__github_fetch_workflow_run_jobs`

Access repositories, issues, and pull requests. Required for some features such as Codex Fetch jobs for a GitHub Actions workflow run. This wrapper returns the latest attempt's jobs from the first page only. Docs: https:

## 59. `mcp__codex_apps__github_get_commit_combined_status`

Access repositories, issues, and pull requests. Required for some features such as Codex Fetch the combined CI status and individual status checks for a commit. This tool is part of plugin \`GitHub\`. 

## 60. `mcp__codex_apps__github_get_issue_comment_reactions`

Access repositories, issues, and pull requests. Required for some features such as Codex Fetch reactions for an issue comment. This tool is part of plugin \`GitHub\`. 

## 61. `mcp__codex_apps__github_get_pr_diff`

Access repositories, issues, and pull requests. Required for some features such as Codex Fetch just the diff or patch text for a pull request. This tool is part of plugin \`GitHub\`. 

## 62. `mcp__codex_apps__github_get_pr_info`

Access repositories, issues, and pull requests. Required for some features such as Codex Get metadata (title, description, refs, and status) for a pull request. This action does *not* include the actual code changes. If 

## 63. `mcp__codex_apps__github_get_pr_reactions`

Access repositories, issues, and pull requests. Required for some features such as Codex Fetch reactions for a GitHub pull request. This tool is part of plugin \`GitHub\`. 

## 64. `mcp__codex_apps__github_get_pr_review_comment_reactions`

Access repositories, issues, and pull requests. Required for some features such as Codex Fetch reactions for a pull request review comment. This tool is part of plugin \`GitHub\`. 

## 65. `mcp__codex_apps__github_get_profile`

Access repositories, issues, and pull requests. Required for some features such as Codex Retrieve the GitHub profile for the authenticated user. This tool is part of plugin \`GitHub\`. 

## 66. `mcp__codex_apps__github_get_repo`

Access repositories, issues, and pull requests. Required for some features such as Codex Retrieve metadata for a GitHub repository. You must populate exactly one of \`repository_full_name\`, \`repository_id\`, or \`repository

## 67. `mcp__codex_apps__github_get_repo_collaborator_permission`

Access repositories, issues, and pull requests. Required for some features such as Codex Return the collaborator permission level for a user on a repository. This tool is part of plugin \`GitHub\`. 

## 68. `mcp__codex_apps__github_get_user_login`

Access repositories, issues, and pull requests. Required for some features such as Codex Return the GitHub login for the authenticated user. This tool is part of plugin \`GitHub\`. 

## 69. `mcp__codex_apps__github_get_users_recent_prs_in_repo`

Access repositories, issues, and pull requests. Required for some features such as Codex List the user's recent GitHub pull requests in a repository. \`limit\` is the final number of PRs returned. The connector paginates t

## 70. `mcp__codex_apps__github_label_pr`

Access repositories, issues, and pull requests. Required for some features such as Codex Label a pull request. This tool is part of plugin \`GitHub\`. 

## 71. `mcp__codex_apps__github_list_installations`

Access repositories, issues, and pull requests. Required for some features such as Codex List installations, optionally limited to managed setup account types. This tool is part of plugin \`GitHub\`. 

## 72. `mcp__codex_apps__github_list_installed_accounts`

Access repositories, issues, and pull requests. Required for some features such as Codex List all accounts that the user has installed our GitHub app on. This tool is part of plugin \`GitHub\`. 

## 73. `mcp__codex_apps__github_list_pr_changed_filenames`

Access repositories, issues, and pull requests. Required for some features such as Codex List changed filenames for a PR across all paginated file-list pages. This tool is part of plugin \`GitHub\`. 

## 74. `mcp__codex_apps__github_list_pull_request_review_threads`

Access repositories, issues, and pull requests. Required for some features such as Codex List inline review threads on a pull request, including resolved state. Returns GraphQL review thread nodes, including comment bodi

## 75. `mcp__codex_apps__github_list_pull_request_reviews`

Access repositories, issues, and pull requests. Required for some features such as Codex List review submissions on a pull request. Returns GraphQL review nodes normalized into the connector's review model. Docs: https:/

## 76. `mcp__codex_apps__github_list_recent_issues`

Access repositories, issues, and pull requests. Required for some features such as Codex Return the most recent GitHub issues the user can access. \`top_k\` is the final result limit. The connector transparently paginates 

## 77. `mcp__codex_apps__github_list_repositories`

Access repositories, issues, and pull requests. Required for some features such as Codex List repositories accessible to the authenticated user. This tool is part of plugin \`GitHub\`. 

## 78. `mcp__codex_apps__github_list_repositories_by_affiliation`

Access repositories, issues, and pull requests. Required for some features such as Codex List repositories accessible to the authenticated user filtered by affiliation. This tool is part of plugin \`GitHub\`. 

## 79. `mcp__codex_apps__github_list_repositories_by_installation`

Access repositories, issues, and pull requests. Required for some features such as Codex List repositories accessible to the authenticated user. This tool is part of plugin \`GitHub\`. 

## 80. `mcp__codex_apps__github_list_user_org_memberships`

Access repositories, issues, and pull requests. Required for some features such as Codex List the authenticated user's organization memberships. This tool is part of plugin \`GitHub\`. 

## 81. `mcp__codex_apps__github_list_user_orgs`

Access repositories, issues, and pull requests. Required for some features such as Codex List organizations the authenticated user is a member of. This tool is part of plugin \`GitHub\`. 

## 82. `mcp__codex_apps__github_lock_issue_conversation`

Access repositories, issues, and pull requests. Required for some features such as Codex Lock an issue or pull request conversation. Allowed \`lock_reason\` values are \`off-topic\`, \`too heated\`, \`resolved\`, and \`spam\`. Doc

## 83. `mcp__codex_apps__github_mark_pull_request_ready_for_review`

Access repositories, issues, and pull requests. Required for some features such as Codex Mark a draft pull request as ready for review. Returns the connector's normalized PR snapshot after the transition. Docs: https://d

## 84. `mcp__codex_apps__github_merge_pull_request`

Access repositories, issues, and pull requests. Required for some features such as Codex Merge a pull request immediately. Returns GitHub's merge result payload (\`sha\`, \`merged\`, \`message\`). Docs: https://docs.github.com

## 85. `mcp__codex_apps__github_remove_issue_assignees`

Access repositories, issues, and pull requests. Required for some features such as Codex Remove assignees from an issue or pull request. Returns a normalized issue snapshot after the mutation. Docs: https://docs.github.c

## 86. `mcp__codex_apps__github_remove_issue_label`

Access repositories, issues, and pull requests. Required for some features such as Codex Remove one label from an issue or pull request. Returns a normalized issue snapshot after the mutation. Docs: https://docs.github.c

## 87. `mcp__codex_apps__github_remove_pull_request_reviewers`

Access repositories, issues, and pull requests. Required for some features such as Codex Remove individual or team reviewer requests from a pull request. Returns the connector's normalized PR snapshot after the mutation.

## 88. `mcp__codex_apps__github_remove_reaction_from_issue_comment`

Access repositories, issues, and pull requests. Required for some features such as Codex Remove a reaction from an issue comment. This tool is part of plugin \`GitHub\`. 

## 89. `mcp__codex_apps__github_remove_reaction_from_pr`

Access repositories, issues, and pull requests. Required for some features such as Codex Remove a reaction from a GitHub pull request. This tool is part of plugin \`GitHub\`. 

## 90. `mcp__codex_apps__github_remove_reaction_from_pr_review_comment`

Access repositories, issues, and pull requests. Required for some features such as Codex Remove a reaction from a pull request review comment. This tool is part of plugin \`GitHub\`. 

## 91. `mcp__codex_apps__github_reply_to_review_comment`

Access repositories, issues, and pull requests. Required for some features such as Codex Reply to an inline review comment on a PR (Files changed thread). comment_id must be the ID of the thread’s top-level inline review

## 92. `mcp__codex_apps__github_request_pull_request_reviewers`

Access repositories, issues, and pull requests. Required for some features such as Codex Request individual or team reviewers on a pull request. Returns the connector's normalized PR snapshot after the review request mut

## 93. `mcp__codex_apps__github_rerun_failed_workflow_run_jobs`

Access repositories, issues, and pull requests. Required for some features such as Codex Re-run all failed jobs in a GitHub Actions workflow run. Use this to retry only the failed jobs from a workflow run, instead of sta

## 94. `mcp__codex_apps__github_rerun_workflow_job`

Access repositories, issues, and pull requests. Required for some features such as Codex Re-run one GitHub Actions workflow job. Use this when a specific failed or cancelled job should be retried without re-running every

## 95. `mcp__codex_apps__github_resolve_review_thread`

Access repositories, issues, and pull requests. Required for some features such as Codex Resolve an inline pull request review thread. Docs: https://docs.github.com/en/graphql/reference/mutations#resolvereviewthread. Thi

## 96. `mcp__codex_apps__github_search`

Access repositories, issues, and pull requests. Required for some features such as Codex Search GitHub files and return matching excerpts when available. Provide a plain string query, avoid GitHub query flags such as \`\`i

## 97. `mcp__codex_apps__github_search_branches`

Access repositories, issues, and pull requests. Required for some features such as Codex Search GitHub branches within a repository. This tool is part of plugin \`GitHub\`. 

## 98. `mcp__codex_apps__github_search_commits`

Access repositories, issues, and pull requests. Required for some features such as Codex Search GitHub commits globally, by organization, or optionally by repository. Include at least one non-qualifier search term in the

## 99. `mcp__codex_apps__github_search_installed_reposito_be740b6e4965`

Access repositories, issues, and pull requests. Required for some features such as Codex Search for a repository (not a file) by name or description. To search for a file, use \`search\`. This tool is part of plugin \`GitHu

## 100. `mcp__codex_apps__github_search_installed_repositories_v2`

Access repositories, issues, and pull requests. Required for some features such as Codex Search repositories within the user's installations using GitHub search. This tool is part of plugin \`GitHub\`. 

## 101. `mcp__codex_apps__github_search_issues`

Access repositories, issues, and pull requests. Required for some features such as Codex Search one repository or every repository the linked account can access. Supply at most one repository selector. Empty lists mean n

## 102. `mcp__codex_apps__github_search_prs`

Access repositories, issues, and pull requests. Required for some features such as Codex Search GitHub pull requests globally, by organization, or optionally by repository. This tool is part of plugin \`GitHub\`. 

## 103. `mcp__codex_apps__github_search_repositories`

Access repositories, issues, and pull requests. Required for some features such as Codex Search for a repository (not a file) by name or description. To search for a file, use \`search\`. This tool is part of plugin \`GitHu

## 104. `mcp__codex_apps__github_unlock_issue_conversation`

Access repositories, issues, and pull requests. Required for some features such as Codex Unlock an issue or pull request conversation. Docs: https://docs.github.com/en/rest/issues/issues?apiVersion=2022-11-28#unlock-an-i

## 105. `mcp__codex_apps__github_unresolve_review_thread`

Access repositories, issues, and pull requests. Required for some features such as Codex Mark an inline pull request review thread as unresolved. Docs: https://docs.github.com/en/graphql/reference/mutations#unresolverevi

## 106. `mcp__codex_apps__github_update_file`

Access repositories, issues, and pull requests. Required for some features such as Codex Replace a UTF-8 text file through GitHub's contents API. Returns the resulting commit SHA and content blob SHA. Use \`content_sha\` f

## 107. `mcp__codex_apps__github_update_issue`

Access repositories, issues, and pull requests. Required for some features such as Codex Update a GitHub issue, including title/body, state, labels, assignees, or milestone. Returns a normalized issue snapshot after the 

## 108. `mcp__codex_apps__github_update_issue_comment`

Access repositories, issues, and pull requests. Required for some features such as Codex Update a top-level PR Conversation comment (Issue comment). This tool is part of plugin \`GitHub\`. 

## 109. `mcp__codex_apps__github_update_pull_request`

Access repositories, issues, and pull requests. Required for some features such as Codex Update PR metadata, base branch, or open/closed state. Returns the connector's normalized PR snapshot. Docs: https://docs.github.co

## 110. `mcp__codex_apps__github_update_ref`

Access repositories, issues, and pull requests. Required for some features such as Codex Move a branch ref to a commit, rejecting a mismatched expected_sha. Inspect the new branch head before retrying a rejected lease. T

## 111. `mcp__codex_apps__github_update_review_comment`

Access repositories, issues, and pull requests. Required for some features such as Codex Update an inline review comment (or a reply) on a PR. This tool is part of plugin \`GitHub\`. 

## 112. `mcp__codex_apps__gmail_apply_labels_to_emails`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. Apply labels to Gmail messages usi

## 113. `mcp__codex_apps__gmail_archive_emails`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. Archive Gmail threads while keepin

## 114. `mcp__codex_apps__gmail_batch_modify_email`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. Add or remove Gmail labels on a ba

## 115. `mcp__codex_apps__gmail_batch_read_email`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. Read up to 100 Gmail messages as M

## 116. `mcp__codex_apps__gmail_batch_read_email_threads`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. Read recent messages from threads 

## 117. `mcp__codex_apps__gmail_bulk_label_matching_emails`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. Apply a label to every Gmail messa

## 118. `mcp__codex_apps__gmail_create_draft`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. Create an unsent Gmail draft from 

## 119. `mcp__codex_apps__gmail_create_label`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. Create a Gmail label. Use this whe

## 120. `mcp__codex_apps__gmail_delete_emails`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. Move one or more existing Gmail me

## 121. `mcp__codex_apps__gmail_forward_emails`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. Forward Gmail messages with struct

## 122. `mcp__codex_apps__gmail_get_profile`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. Return the current Gmail user's pr

## 123. `mcp__codex_apps__gmail_list_drafts`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. List Gmail drafts with summarized 

## 124. `mcp__codex_apps__gmail_list_labels`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. List Gmail labels with per-label c

## 125. `mcp__codex_apps__gmail_read_attachment`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. Read one attachment from a Gmail m

## 126. `mcp__codex_apps__gmail_read_email`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. Read one Gmail message in the requ

## 127. `mcp__codex_apps__gmail_read_email_thread`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. Read the most recent messages in a

## 128. `mcp__codex_apps__gmail_search_email_ids`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. Retrieve Gmail message IDs that ma

## 129. `mcp__codex_apps__gmail_search_emails`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. Search Gmail for emails matching a

## 130. `mcp__codex_apps__gmail_send_draft`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. Send an existing Gmail draft as cu

## 131. `mcp__codex_apps__gmail_send_email`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. Send a Gmail message now from the 

## 132. `mcp__codex_apps__gmail_update_draft`

Gmail tools for label counts, searching and reading emails/threads/attachments, reviewing drafts, and explicit mail changes like send, draft, forward, archive, Trash, and label actions. Patch selected fields in an existi

## 133. `mcp__codex_apps__hevy_create_custom_exercise`

Interact with your Hevy data Always give preference to Hevy's pre-created exercise templates. Use this to create any new exercises that do not exist when searching search_hevy_exercises. Use this only as a last resort. T

## 134. `mcp__codex_apps__hevy_create_hevy_plan`

Interact with your Hevy data Save a plan directly in Hevy without showing it to the user first. Only use this tool when the user explicitly asks to skip the preview (e.g. "save it straight to Hevy without showing me"). R

## 135. `mcp__codex_apps__hevy_create_hevy_routine`

Interact with your Hevy data Save a routine directly in the user's Hevy account. Only use this when the user explicitly asks to skip the preview (e.g. "save it straight to Hevy without showing me"). Requests like "create

## 136. `mcp__codex_apps__hevy_create_hevy_routine_folder`

Interact with your Hevy data Create a routine folder in Hevy. Folders are used to organise routines. This tool is part of plugin \`Hevy\`. 

## 137. `mcp__codex_apps__hevy_get_hevy_routine_folders`

Interact with your Hevy data Fetch existing routine folders for the authenticated Hevy user. This tool is part of plugin \`Hevy\`. 

## 138. `mcp__codex_apps__hevy_get_user_exercise_history`

Interact with your Hevy data Fetch exercise history for a specific exercise template for the authenticated Hevy user. This tool is part of plugin \`Hevy\`. 

## 139. `mcp__codex_apps__hevy_get_user_preferences`

Interact with your Hevy data Fetch the authenticated Hevy user's profile and unit preferences (weight_unit, distance_unit). Workout data from other tools is always in kg and meters; use these preferences to present weigh

## 140. `mcp__codex_apps__hevy_get_user_routines`

Interact with your Hevy data Fetch routines for the authenticated Hevy user. This tool is part of plugin \`Hevy\`. 

## 141. `mcp__codex_apps__hevy_get_user_workouts`

Interact with your Hevy data Fetch workouts for the authenticated Hevy user. This tool is part of plugin \`Hevy\`. 

## 142. `mcp__codex_apps__hevy_render_hevy_plan`

Interact with your Hevy data Show the user a proposed workout plan. A plan is a grouped set of routines (e.g. "💪 Upper/Lower Split" or "🦍 Operation: Summer Body"). This is the default tool whenever the user asks to cre

## 143. `mcp__codex_apps__hevy_render_hevy_routine`

Interact with your Hevy data Show the user a single proposed routine. This is the default tool whenever the user asks to create, make, build or import one new routine (including from a file or PDF); for a plan with sever

## 144. `mcp__codex_apps__hevy_render_hevy_workouts`

Interact with your Hevy data Display an arbitrary list of workouts as UI. Use this after fetching, filtering or combining workouts (e.g. from get_user_workouts) to show the user a specific selection of workouts. The inpu

## 145. `mcp__codex_apps__hevy_search_hevy_exercises`

Interact with your Hevy data Search the authenticated user's available Hevy exercise templates by exercise name. Use this before creating a routine to find the correct exercise_template_id values. You can pass an array o

## 146. `mcp__codex_apps__hevy_update_hevy_routine`

Interact with your Hevy data Update a routine in Hevy. Before calling this tool, use search_hevy_exercises to find the correct exercise_template_id for each exercise name unless the IDs are already known. This tool is pa

## 147. `mcp__codex_apps__higgsfield_animation_actions`

Tools for working with Higgsfield. Read-only catalog of the 3D rig animation library (678 actions: locomotion, gestures, dancing, combat, daily actions). Search by name or browse by group/category to find the animation_a

## 148. `mcp__codex_apps__higgsfield_apps_describe`

Tools for working with Higgsfield. Get an app's action contract: with \`action\`, the full input/output schema + execution mode for that one action; without it, a summary of every action. Also returns \`manifest_revision\`, 

## 149. `mcp__codex_apps__higgsfield_apps_invoke`

Tools for working with Higgsfield. Run one described action on a Marketplace app AS the current user. First call apps_describe(app_id, action) to get the exact \`arguments\` schema and the \`manifest_revision\`, then pass th

## 150. `mcp__codex_apps__higgsfield_apps_search`

Tools for working with Higgsfield. Search Higgsfield Marketplace apps callable through MCP. Returns each app's id, name, and the actions it exposes. Flow: apps_search to find an app → apps_describe(app_id, action) to get

## 151. `mcp__codex_apps__higgsfield_balance`

Tools for working with Higgsfield. Get the user's available credits and current subscription plan. For transaction history, call \`transactions\` instead. This tool is part of plugin \`Higgsfield\`. 

## 152. `mcp__codex_apps__higgsfield_cancel_trial_auto_renewal`

Tools for working with Higgsfield. Cancel the auto-renewal of the Higgsfield MCP 3-day free Plus trial. Call this when the user asks to cancel the trial, cancel auto-renewal, stop the upcoming charge, or asks how to canc

## 153. `mcp__codex_apps__higgsfield_create_voice`

Tools for working with Higgsfield. Open the Create Voice Apps UI. Call this immediately when the user asks to create a voice, call the Create Voice tool, or needs a local browser record/upload surface and no confirmed au

## 154. `mcp__codex_apps__higgsfield_create_voice_from_confirmed_audio`

Tools for working with Higgsfield. Backend-only creation of a cloned voice from an already confirmed audio upload. Do not call this tool until audio_media_id and name are already known. For direct creation, first upload 

## 155. `mcp__codex_apps__higgsfield_create_website`

Tools for working with Higgsfield. Start a new full-stack website. Creates the website and a git repo: a React 19 + TanStack Start app, server-rendered, in ONE Cloudflare Worker, with D1 / R2 / KV / Durable Objects / Con

## 156. `mcp__codex_apps__higgsfield_deploy_game`

Tools for working with Higgsfield. Deploy a built browser game from an uploaded zip archive and get a shareable play URL. Deploying also lists the game in the Higgsfield marketplace. The zip must contain at its root: log

## 157. `mcp__codex_apps__higgsfield_deploy_website`

Tools for working with Higgsfield. Build and deploy the website via CI, then return its live URL. Every deploy ships the live site at the website's public URL (there is no separate preview stage). IMPORTANT: commit and g

## 158. `mcp__codex_apps__higgsfield_dubbing`

Tools for working with Higgsfield. Dub a video into another language: translate the spoken audio, synthesize it in the target language, and lip-sync the result back onto the video. Use this when the user asks to dub, tra

## 159. `mcp__codex_apps__higgsfield_explainer_video`

Tools for working with Higgsfield. Assemble an explainer / narrated video from its per-block clips and voice takes: stitches two or more existing video clips into one MP4, in order, optionally laying a per-block voice/au

## 160. `mcp__codex_apps__higgsfield_generate_3d`

Tools for working with Higgsfield. Generate a 3D GLB mesh. Use \`models_explore(type:'3d')\` to pick a model and see its \`medias[].roles\` and \`parameters\`. Apps UI local file: call \`media_upload_widget\`; remote tools canno

## 161. `mcp__codex_apps__higgsfield_generate_audio`

Tools for working with Higgsfield. Generate speech/voice audio (text-to-speech). DEFAULT model: seed_audio (Seed Audio 1.0 by ByteDance) — use it unless the user explicitly asks for a different engine. seed_audio takes a

## 162. `mcp__codex_apps__higgsfield_generate_image`

Tools for working with Higgsfield. Generate an image. Apps UI local file media: call \`media_upload_widget\`; do not ask for Claude chat attachments because remote tools cannot read them. Web media URL: call \`media_import_

## 163. `mcp__codex_apps__higgsfield_generate_video`

Tools for working with Higgsfield. Generate a video. Apps UI local file: call \`media_upload_widget\`; do not ask for Claude chat attachments; remote tools cannot read them. Web media URL: call \`media_import_url\`, pass ret

## 164. `mcp__codex_apps__higgsfield_get_explainer_presets`

Tools for working with Higgsfield. Show the explainer video style presets (CMS-managed catalog). Returns preset ids, names, and preview media. When the user picks one, resolve it with resolve_explainer_preset to get the 

## 165. `mcp__codex_apps__higgsfield_get_game_creation_bundle_file`

Tools for working with Higgsfield. Read a safe text file or directory from the game-generation resource folder. Use this after get_game_creation_instructions when the instructions require any resource file. This tool is 

## 166. `mcp__codex_apps__higgsfield_get_game_creation_instructions`

Tools for working with Higgsfield. REQUIRED before creating or editing any browser game. Reads the game-generation SKILL.md resource and returns the current list of files available through get_game_creation_bundle_file. 

## 167. `mcp__codex_apps__higgsfield_get_website_creation_bundle_file`

Tools for working with Higgsfield. Read a safe text file or directory from the website-builder-flow resource folder. Use this after get_website_creation_instructions when the instructions require any resource file. This 

## 168. `mcp__codex_apps__higgsfield_get_website_creation_instructions`

Tools for working with Higgsfield. REQUIRED before creating or editing any website with the website tools (create_website / website_repo_access / deploy_website / website_db / website_secrets). Reads the website-builder-

## 169. `mcp__codex_apps__higgsfield_get_workflow_bundle_file`

Tools for working with Higgsfield. Read a safe text file or directory from a workflow's resource folder. Use this after get_workflow_instructions when the SKILL.md requires a template, reference, or script file. This too

## 170. `mcp__codex_apps__higgsfield_get_workflow_instructions`

Tools for working with Higgsfield. Discover and load multi-step content-generation workflows (each a bundled SKILL.md that orchestrates the generate_* tools). Call with NO argument to list available workflows and their t

## 171. `mcp__codex_apps__higgsfield_job_display`

Tools for working with Higgsfield. Show a single generation result in the UI widget by job ID. Pass exactly one job ID — to display multiple generations, call this tool once per ID. Use to re-display or inspect a previou

## 172. `mcp__codex_apps__higgsfield_list_voices`

Tools for working with Higgsfield. List available voices for speech and voice tools. Returns built-in preset voices plus the user's own custom voices. Each voice has a voice_id and a voice_type ('preset' or 'element'); p

## 173. `mcp__codex_apps__higgsfield_list_website_categories`

Tools for working with Higgsfield. List the content categories a website can be filed under — each with a slug, label, description, and display position. create_website REQUIRES a \`category\`; call this first to get the v

## 174. `mcp__codex_apps__higgsfield_list_websites`

Tools for working with Higgsfield. List the websites you own — each with its id, name, slug, and live URL. Use this to find the id of a website you created earlier so you can edit, deploy, or check its status. This tool 

## 175. `mcp__codex_apps__higgsfield_list_workspaces`

Tools for working with Higgsfield. List every workspace the user can access (their private workspace plus any shared/team workspaces). The \`is_selected\` field marks which workspace MCP operations currently target. Use wh

## 176. `mcp__codex_apps__higgsfield_media_confirm`

Tools for working with Higgsfield. Confirm file uploads after using the upload_url method. Call this after the curl uploads succeed. Supports confirming multiple uploads at once via media_ids. This tool is part of plugin

## 177. `mcp__codex_apps__higgsfield_media_import_url`

Tools for working with Higgsfield. Import an HTTPS image, video, or audio URL into Higgsfield storage and return a confirmed media_id. Use this before generate_image/generate_video when the user provides a web media URL;

## 178. `mcp__codex_apps__higgsfield_media_upload`

Tools for working with Higgsfield. Upload media for use in generation, or general files (documents, archives, code) for sharing. Returns presigned URLs for clients that can upload bytes themselves; run the generated curl

## 179. `mcp__codex_apps__higgsfield_media_upload_widget`

Tools for working with Higgsfield. Open the Higgsfield upload widget for a user-provided local image, video, or audio file. Call this immediately when the user says they have a local photo, image, video, or audio on thei

## 180. `mcp__codex_apps__higgsfield_models_explore`

Tools for working with Higgsfield. Find generation models. Use recommend with goal + input context; use get for model constraints. This tool is part of plugin \`Higgsfield\`. 

## 181. `mcp__codex_apps__higgsfield_motion_control`

Tools for working with Higgsfield. Animate an existing character image with the motion and camera movement from a reference video using Kling 3.0 Motion Control. Use this when the user asks to recast, puppeteer, transfer

## 182. `mcp__codex_apps__higgsfield_outpaint_image`

Tools for working with Higgsfield. Expand or uncrop an existing image by outpainting beyond the original frame while preserving the source content. Use this when the user asks to extend the background, make an image wide

## 183. `mcp__codex_apps__higgsfield_participate_in_contest`

Tools for working with Higgsfield. Enter the website in the current Higgsfield app contest, together with the social-media links promoting it. A website not yet PUBLISHED to the community feed is published automatically 

## 184. `mcp__codex_apps__higgsfield_personal_clipper_create`

Tools for working with Higgsfield. Turn YouTube videos into ready-to-share clips. This is a long-running job and can take up to 30+ minutes. Before starting, ask the user how many clips they want, which clip aspect ratio

## 185. `mcp__codex_apps__higgsfield_personal_clipper_jobs`

Tools for working with Higgsfield. Show recent clipping jobs. This tool is part of plugin \`Higgsfield\`. 

## 186. `mcp__codex_apps__higgsfield_personal_clipper_status`

Tools for working with Higgsfield. Check clip creation progress. This tool is part of plugin \`Higgsfield\`. 

## 187. `mcp__codex_apps__higgsfield_presets_show`

Tools for working with Higgsfield. Show available Higgsfield presets for image-to-video generation. Returns preset ids, names, previews, and descriptions. This tool is part of plugin \`Higgsfield\`. 

## 188. `mcp__codex_apps__higgsfield_publish_game`

Tools for working with Higgsfield. Publish a deployed game to the Higgsfield marketplace. This does not deploy anything: the game must already be live — use deploy_game first, then pass the game id from its response. The

## 189. `mcp__codex_apps__higgsfield_publish_website`

Tools for working with Higgsfield. Publish the website: lists the website's CURRENT LIVE production deploy on the Higgsfield community feed ('show in feed'), where other users can discover it. This does NOT deploy — depl

## 190. `mcp__codex_apps__higgsfield_reframe`

Tools for working with Higgsfield. Expand or reframe an existing video to a new aspect ratio while preserving the source content. Use this when the user asks to make a video vertical, horizontal, square, wider, taller, o

## 191. `mcp__codex_apps__higgsfield_remove_background`

Tools for working with Higgsfield. Remove or cut out the background from an existing image or video. Use this when the user asks for background removal, a transparent background, an isolated subject, a clean cutout, or a

## 192. `mcp__codex_apps__higgsfield_rename_website`

Tools for working with Higgsfield. Rename the website's SUBDOMAIN (the slug in its public URL). The site is re-deployed under the new subdomain and the OLD subdomain STOPS WORKING — anyone holding the old URL must be giv

## 193. `mcp__codex_apps__higgsfield_resolve_explainer_preset`

Tools for working with Higgsfield. Resolve an explainer video style preset (from get_explainer_presets) into a style reference media_id: the backend imports the preset's style image into the user's media storage. Pass th

## 194. `mcp__codex_apps__higgsfield_select_workspace`

Tools for working with Higgsfield. Set or clear the active workspace — the one all subsequent MCP operations bill against and read from (generations, balance, transactions, uploads, custom references). How to work with w

## 195. `mcp__codex_apps__higgsfield_shorts_studio_create`

Tools for working with Higgsfield. Start a Shorts Studio short: restyle one uploaded source video (4s–120s) into a set of AI-generated short-form clips using a style preset. PAID — reserves credits. Prerequisites, gather

## 196. `mcp__codex_apps__higgsfield_shorts_studio_create_preset`

Tools for working with Higgsfield. Create a user-owned Shorts Studio style preset from reference media (videos + images). This just stores a STYLE — no generation, no credits. Reference media must be public https URLs (u

## 197. `mcp__codex_apps__higgsfield_shorts_studio_list_presets`

Tools for working with Higgsfield. Browse Shorts Studio style presets — the visual STYLE a short is restyled toward. Use this when the user wants to make a short and needs to choose a look: they can pick one of these or 

## 198. `mcp__codex_apps__higgsfield_shorts_studio_list_sessions`

Tools for working with Higgsfield. List the caller's past Shorts Studio sessions (newest first) to find a session_id to poll with shorts_studio_status. This tool is part of plugin \`Higgsfield\`. 

## 199. `mcp__codex_apps__higgsfield_shorts_studio_status`

Tools for working with Higgsfield. Poll one Shorts Studio session. Returns {id, status, job_ids}. status='completed' means every clip job is terminal (not necessarily successful). Poll each job_id via job_status for its 

## 200. `mcp__codex_apps__higgsfield_show_characters`

Tools for working with Higgsfield. Soul Characters widget — reusable trained identity models. Actions: \`list\` (browse), \`train\` (needs \`name\` + 5-20 ref images, ~10 min, non-blocking — widget polls), \`status\` (inspect by

## 201. `mcp__codex_apps__higgsfield_show_generations`

Tools for working with Higgsfield. Browse past completed non-Marketing Studio generations and render them directly in the widget. Returns generations with {id, type, status, model, params, results}. Use show_marketing_st

## 202. `mcp__codex_apps__higgsfield_show_marketing_studio`

Tools for working with Higgsfield. When replying to the user, do not say \`ms_image\` — refer to it as "DTC Ads". Open the Marketing Studio widget with the user's product/webproduct/avatar library. \`type\` is one of: \`avata

## 203. `mcp__codex_apps__higgsfield_show_marketing_studio_generations`

Tools for working with Higgsfield. Browse past completed Marketing Studio generations only. Returns Marketing Studio video and ad/image generations with {id, type, status, model, params, results}. Use show_generations fo

## 204. `mcp__codex_apps__higgsfield_show_medias`

Tools for working with Higgsfield. List your uploaded media files by type. Returns media IDs, URLs, and creation timestamps. Pass media IDs as value in the medias array of generation tools. Paginated: if next_cursor is n

## 205. `mcp__codex_apps__higgsfield_show_plans_and_credits`

Tools for working with Higgsfield. Open the single combined pricing widget for everything billing-related. The widget has two tabs the user can switch between: **Upgrade Plan** (Plus + Ultra, monthly + annual subscriptio

## 206. `mcp__codex_apps__higgsfield_show_reference_elements`

Tools for working with Higgsfield. Elements widget — reusable characters / environments / props per workspace. Actions: - \`list\` (default; paginated by \`created_at\` DESC, use \`cursor\` from prev \`next_cursor\`). - \`get\` (d

## 207. `mcp__codex_apps__higgsfield_sync_agents`

Tools for working with Higgsfield. Sync Agents — imports the user's user-authored Skills and a personality dump from the current host LLM into Higgsfield. One trigger, one upload, one final confirmation. Calling modes: 1

## 208. `mcp__codex_apps__higgsfield_transactions`

Tools for working with Higgsfield. List the user's credit transactions (spend/refund/grant/deduct), newest first. Paginated: if next_cursor is not null, pass it as cursor to get the next page. This tool is part of plugin

## 209. `mcp__codex_apps__higgsfield_upscale_image`

Tools for working with Higgsfield. Upscale and enhance an existing image. Use this when the user asks to upscale, enhance, or increase the resolution of an image to 2K/4K. This tool does not use prompt or count. Provider

## 210. `mcp__codex_apps__higgsfield_upscale_video`

Tools for working with Higgsfield. Upscale and enhance an existing video. Use this when the user asks to upscale, enhance, sharpen, denoise, restore, or convert a video to higher resolution. This tool does not use prompt

## 211. `mcp__codex_apps__higgsfield_video_analysis_create`

Tools for working with Higgsfield. Start a scene-by-scene analysis of a video. Provide EXACTLY ONE of: (a) video_input_id — UUID of a video the user has uploaded via media_upload/media_confirm, or (b) youtube_url — a You

## 212. `mcp__codex_apps__higgsfield_video_analysis_jobs`

Tools for working with Higgsfield. List the user's video analyses in the current workspace, newest first. Paginate by passing the previous response's cursor. This tool is part of plugin \`Higgsfield\`. 

## 213. `mcp__codex_apps__higgsfield_video_analysis_status`

Tools for working with Higgsfield. Get the status and result of a video analysis. Poll this after video_analysis_create until status='completed' (scenes populated) or 'failed' (fail_reason populated). Analyses typically 

## 214. `mcp__codex_apps__higgsfield_virality_predictor`

Tools for working with Higgsfield. Virality Predictor predicts a video's virality potential, engagement, attention, audience response, retention risk, hook strength, and creative performance with an interactive dashboard

## 215. `mcp__codex_apps__higgsfield_voice_change`

Tools for working with Higgsfield. Replace the spoken voice in a video with a different voice while keeping the original timing and visuals, then re-merge the new audio onto the video. Use this when the user asks to chan

## 216. `mcp__codex_apps__higgsfield_website_db`

Tools for working with Higgsfield. Inspect the website's database (D1 / SQLite), READ-ONLY. The website has ONE database — the live site's real data. Pick an operation: 'tables' (list tables); 'schema' (a table's columns

## 217. `mcp__codex_apps__higgsfield_website_repo_access`

Tools for working with Higgsfield. Get direct git access to a website's repo to edit it — THE way to get the website's code. Returns the repo URL, branch, slug, and a scoped token; clone it with the terminal tool, edit f

## 218. `mcp__codex_apps__higgsfield_website_secrets`

Tools for working with Higgsfield. Manage a website's SECRETS (environment variables: API keys, tokens). Set them HERE instead of hardcoding them in source. One tool, three operations: 'set' (store/replace — needs name +

## 219. `mcp__codex_apps__higgsfield_website_status`

Tools for working with Higgsfield. Get the website's deploy status — the live URL and the status of the last deploy. Use to check a deploy that returned 'pending', or to fetch the live URL. This tool is part of plugin \`H

## 220. `mcp__codex_apps__hotline_get_local_hotline`

Look up local suicide or self harm helpline information for the user based on country inferred from the conversation. You must use this tool before providing a suicide or self-harm helpline; do not use web search or gues

## 221. `mcp__codex_apps__lifttrack_create_workout`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 222. `mcp__codex_apps__lifttrack_delete_workout`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 223. `mcp__codex_apps__lifttrack_get_activities`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 224. `mcp__codex_apps__lifttrack_get_coach_profile`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 225. `mcp__codex_apps__lifttrack_get_exercise_history`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 226. `mcp__codex_apps__lifttrack_get_folders`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 227. `mcp__codex_apps__lifttrack_get_help_article`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 228. `mcp__codex_apps__lifttrack_get_program_detail`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 229. `mcp__codex_apps__lifttrack_get_programs`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 230. `mcp__codex_apps__lifttrack_get_schedule`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 231. `mcp__codex_apps__lifttrack_get_training_maxes`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 232. `mcp__codex_apps__lifttrack_get_user_settings`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 233. `mcp__codex_apps__lifttrack_get_weekly_training_status`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 234. `mcp__codex_apps__lifttrack_get_workout_detail`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 235. `mcp__codex_apps__lifttrack_get_workout_templates`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 236. `mcp__codex_apps__lifttrack_schedule_workout`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 237. `mcp__codex_apps__lifttrack_search_exercises`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 238. `mcp__codex_apps__lifttrack_search_help_center`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 239. `mcp__codex_apps__lifttrack_set_training_max`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 240. `mcp__codex_apps__lifttrack_unschedule_workout`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 241. `mcp__codex_apps__lifttrack_update_workout`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 242. `mcp__codex_apps__lifttrack_validate_exercise_names`

Enables reading a lifter’s workout templates, settings, exercise catalog, scheduled sessions, past activities, exercise history, and training maxes to answer questions and make data-aware strength-training recommendation

## 243. `mcp__codex_apps__linear_create_attachment`

Plan and build products Deprecated fallback for tiny files only. Accepts base64 file content, verifies SHA-256 checksum, and uploads it through the MCP worker. Prefer \`prepare_attachment_upload\` plus direct PUT plus \`cre

## 244. `mcp__codex_apps__linear_create_attachment_from_upload`

Plan and build products Link an already-uploaded Linear assetUrl to an existing issue as an attachment. Use this only after: 1. prepare_attachment_upload returned an assetUrl and uploadRequest. 2. The client successfully

## 245. `mcp__codex_apps__linear_create_initiative_label`

Plan and build products Create a new Linear initiative label. Deprecated: use \`save_initiative_label\`, which can also update labels. This tool is part of plugin \`Linear\`. 

## 246. `mcp__codex_apps__linear_create_issue_label`

Plan and build products Create a new Linear issue label. Deprecated: use \`save_issue_label\`, which can also update labels. This tool is part of plugin \`Linear\`. 

## 247. `mcp__codex_apps__linear_delete_attachment`

Plan and build products Delete an attachment by ID. This tool is part of plugin \`Linear\`. 

## 248. `mcp__codex_apps__linear_delete_comment`

Plan and build products Delete a Linear comment. Inline description comments (those with non-null \`quotedText\`) anchor a mark in the editor, so their root cannot be deleted — delete the replies individually or resolve th

## 249. `mcp__codex_apps__linear_delete_customer`

Plan and build products Delete a customer in Linear. This tool is part of plugin \`Linear\`. 

## 250. `mcp__codex_apps__linear_delete_customer_need`

Plan and build products Archive a customer need in Linear. This tool is part of plugin \`Linear\`. 

## 251. `mcp__codex_apps__linear_delete_diff_comment`

Plan and build products Delete a comment or persisted draft from a Linear diff. This tool is part of plugin \`Linear\`. 

## 252. `mcp__codex_apps__linear_delete_status_update`

Plan and build products Delete (archive) a project or initiative status update. This tool is part of plugin \`Linear\`. 

## 253. `mcp__codex_apps__linear_extract_images`

Plan and build products Extract and fetch images from markdown content. Use this to view screenshots, diagrams, or other images embedded in Linear issues, comments, or documents. Pass the markdown content (e.g., issue de

## 254. `mcp__codex_apps__linear_fetch`

Plan and build products Fetch a Linear issue, project, initiative, or document by entity-prefixed ID. Use to get full details for results returned by the search tool. Also works with any known identifier. This tool is pa

## 255. `mcp__codex_apps__linear_get_agent_skill`

Plan and build products Retrieve a Linear Agent skill by ID, including its full markdown instructions. This tool is part of plugin \`Linear\`. 

## 256. `mcp__codex_apps__linear_get_attachment`

Plan and build products Retrieve an attachment's content by ID. This tool is part of plugin \`Linear\`. 

## 257. `mcp__codex_apps__linear_get_diff`

Plan and build products Exact lookup for a Linear diff. Use with review URLs, GitHub PR URLs, Linear full identifiers, UUIDs, or slugs. This tool is part of plugin \`Linear\`. 

## 258. `mcp__codex_apps__linear_get_diff_threads`

Plan and build products Exact lookup for diff threads and the authenticated user's drafts. Use with review URLs, GitHub PR URLs, Linear full identifiers, UUIDs, or slugs. This tool is part of plugin \`Linear\`. 

## 259. `mcp__codex_apps__linear_get_document`

Plan and build products Retrieve a Linear document by ID or slug. This tool is part of plugin \`Linear\`. 

## 260. `mcp__codex_apps__linear_get_initiative`

Plan and build products Retrieve detailed information about a specific initiative in Linear. This tool is part of plugin \`Linear\`. 

## 261. `mcp__codex_apps__linear_get_issue`

Plan and build products Retrieve detailed information about an issue by ID, including attachments, git branch name, and active Triage Intelligence suggestions when the issue is in triage. This tool is part of plugin \`Lin

## 262. `mcp__codex_apps__linear_get_issue_status`

Plan and build products Retrieve detailed information about an issue status in Linear by name or ID. This tool is part of plugin \`Linear\`. 

## 263. `mcp__codex_apps__linear_get_milestone`

Plan and build products Retrieve details of a specific milestone by ID or name. This tool is part of plugin \`Linear\`. 

## 264. `mcp__codex_apps__linear_get_notifications`

Plan and build products Get a page of notifications from the authenticated user's Linear inbox. This tool is part of plugin \`Linear\`. 

## 265. `mcp__codex_apps__linear_get_project`

Plan and build products Retrieve details of a specific project in Linear. This tool is part of plugin \`Linear\`. 

## 266. `mcp__codex_apps__linear_get_release`

Plan and build products Retrieve details of a release by ID or slug. This tool is part of plugin \`Linear\`. 

## 267. `mcp__codex_apps__linear_get_release_note`

Plan and build products Retrieve release notes by ID or slug, including markdown content. This tool is part of plugin \`Linear\`. 

## 268. `mcp__codex_apps__linear_get_status_updates`

Plan and build products List or get project/initiative status updates. Pass \`id\` to get a specific update, or filter to list. This tool is part of plugin \`Linear\`. 

## 269. `mcp__codex_apps__linear_get_team`

Plan and build products Retrieve details of a specific Linear team. This tool is part of plugin \`Linear\`. 

## 270. `mcp__codex_apps__linear_get_template`

Plan and build products Retrieve a Linear template by ID or name: the content it pre-fills, the ids it applies, its sub-issues, and its form fields. Pass the template to save_issue or save_project to apply it. References

## 271. `mcp__codex_apps__linear_get_user`

Plan and build products Retrieve details of a specific Linear user. This tool is part of plugin \`Linear\`. 

## 272. `mcp__codex_apps__linear_get_workspace`

Plan and build products Retrieve the connected Linear workspace. This tool is part of plugin \`Linear\`. 

## 273. `mcp__codex_apps__linear_list_agent_skills`

Plan and build products List Linear Agent skills available to the authenticated user. This tool is part of plugin \`Linear\`. 

## 274. `mcp__codex_apps__linear_list_comments`

Plan and build products List comments on a Linear issue, project, initiative, document, project milestone, or project/initiative status update. Provide exactly one of \`issueId\`, \`projectId\`, \`initiativeId\`, \`documentId\`,

## 275. `mcp__codex_apps__linear_list_customers`

Plan and build products List customers in the user's Linear workspace. This tool is part of plugin \`Linear\`. 

## 276. `mcp__codex_apps__linear_list_cycles`

Plan and build products Retrieve cycles for a specific Linear team. This tool is part of plugin \`Linear\`. 

## 277. `mcp__codex_apps__linear_list_diffs`

Plan and build products List Linear diff pull requests visible to the authenticated user. This tool is part of plugin \`Linear\`. 

## 278. `mcp__codex_apps__linear_list_documents`

Plan and build products List documents in the user's Linear workspace. This tool is part of plugin \`Linear\`. 

## 279. `mcp__codex_apps__linear_list_initiative_labels`

Plan and build products List available initiative labels in the Linear workspace. This tool is part of plugin \`Linear\`. 

## 280. `mcp__codex_apps__linear_list_initiatives`

Plan and build products List initiatives in the user's Linear workspace. This tool is part of plugin \`Linear\`. 

## 281. `mcp__codex_apps__linear_list_issue_labels`

Plan and build products List available issue labels in a Linear workspace or team. This tool is part of plugin \`Linear\`. 

## 282. `mcp__codex_apps__linear_list_issue_statuses`

Plan and build products List available issue statuses in a Linear team. This tool is part of plugin \`Linear\`. 

## 283. `mcp__codex_apps__linear_list_issues`

Plan and build products List issues in the user's Linear workspace, including active Triage Intelligence suggestions for issues in triage. For my issues, use "me" as the assignee. Use "null" for no assignee. This tool is

## 284. `mcp__codex_apps__linear_list_milestones`

Plan and build products List all milestones in a Linear project. This tool is part of plugin \`Linear\`. 

## 285. `mcp__codex_apps__linear_list_project_labels`

Plan and build products List available project labels in the Linear workspace. This tool is part of plugin \`Linear\`. 

## 286. `mcp__codex_apps__linear_list_projects`

Plan and build products List projects in the user's Linear workspace. This tool is part of plugin \`Linear\`. 

## 287. `mcp__codex_apps__linear_list_release_notes`

Plan and build products List release notes in the workspace, optionally filtered by pipeline or covered release. This tool is part of plugin \`Linear\`. 

## 288. `mcp__codex_apps__linear_list_release_pipelines`

Plan and build products List release pipelines in the workspace. This tool is part of plugin \`Linear\`. 

## 289. `mcp__codex_apps__linear_list_releases`

Plan and build products List releases in the workspace, with optional filtering by pipeline, stage, version, and text. This tool is part of plugin \`Linear\`. 

## 290. `mcp__codex_apps__linear_list_teams`

Plan and build products List teams in the user's Linear workspace. This tool is part of plugin \`Linear\`. 

## 291. `mcp__codex_apps__linear_list_templates`

Plan and build products List the Linear issue, project, and document templates available to the authenticated user. Use this to find the template a team expects, then call get_template for its content. This tool is part 

## 292. `mcp__codex_apps__linear_list_users`

Plan and build products Retrieve users in the Linear workspace. This tool is part of plugin \`Linear\`. 

## 293. `mcp__codex_apps__linear_mark_notification`

Plan and build products Mark a Linear inbox notification as read or unread, or snooze or unsnooze it. This tool is part of plugin \`Linear\`. 

## 294. `mcp__codex_apps__linear_merge_diff`

Plan and build products Merge a Linear diff or add it to the repository's merge queue. This tool is part of plugin \`Linear\`. 

## 295. `mcp__codex_apps__linear_prepare_attachment_upload`

Plan and build products Prepare a direct Linear file upload for an existing issue. Workflow: 1. Call this tool with issue, filename, contentType, and size. 2. Upload raw bytes with PUT to uploadRequest.url outside MCP. 3

## 296. `mcp__codex_apps__linear_resolve_diff_thread`

Plan and build products Resolve or reopen a top-level comment thread on a Linear diff. This tool is part of plugin \`Linear\`. 

## 297. `mcp__codex_apps__linear_save_comment`

Plan and build products Create or update a comment on a Linear issue, project, initiative, document, project milestone, or project/initiative status update. If \`id\` is provided, updates the existing comment; otherwise cr

## 298. `mcp__codex_apps__linear_save_customer`

Plan and build products Create or update a Linear customer. If \`id\` is provided, updates the existing customer; otherwise creates a new one. When creating, \`name\` is required. This tool is part of plugin \`Linear\`. 

## 299. `mcp__codex_apps__linear_save_customer_need`

Plan and build products Create or update a customer need (request) in Linear. If \`id\` is provided, updates the existing need; otherwise creates a new one. When creating, \`body\` is required. This tool is part of plugin \`L

## 300. `mcp__codex_apps__linear_save_diff_comment`

Plan and build products Create, reply to, or edit a comment or persisted draft on a Linear diff. Set draft to true to save without submitting. Provide draftId to edit or submit a persisted draft, and commentId only to ed

## 301. `mcp__codex_apps__linear_save_document`

Plan and build products Create or update a Linear document. If \`id\` is provided, edits the existing document; otherwise creates a new one. When creating, \`title\` is required and exactly one parent (\`project\`, \`issue\`, \`i

## 302. `mcp__codex_apps__linear_save_initiative`

Plan and build products Create or update a Linear initiative. If \`id\` is provided, updates the existing initiative; otherwise creates a new one. When creating, \`name\` is required. To change parts of the description witho

## 303. `mcp__codex_apps__linear_save_initiative_label`

Plan and build products Create or update a Linear initiative label. If \`id\` is provided, updates the existing label; otherwise creates a new one. When creating, \`name\` is required. This tool is part of plugin \`Linear\`. 

## 304. `mcp__codex_apps__linear_save_issue`

Plan and build products Create or update a Linear issue. If \`id\` is provided, updates the existing issue; otherwise creates a new one. When creating, \`team\` is required, and \`title\` is required unless \`template\` is set. 

## 305. `mcp__codex_apps__linear_save_issue_label`

Plan and build products Create or update a Linear issue label. If \`id\` is provided, updates the existing label; otherwise creates a new one. When creating, \`name\` is required. This tool is part of plugin \`Linear\`. 

## 306. `mcp__codex_apps__linear_save_milestone`

Plan and build products Create or update a milestone in a Linear project. If \`id\` is provided, updates the existing milestone; otherwise creates a new one. When creating, \`name\` is required. This tool is part of plugin \`

## 307. `mcp__codex_apps__linear_save_project`

Plan and build products Create or update a Linear project. If \`id\` is provided, updates the existing project; otherwise creates a new one. When creating, \`name\` and at least one team (via \`addTeams\` or \`setTeams\`) are re

## 308. `mcp__codex_apps__linear_save_project_label`

Plan and build products Create or update a Linear project label. If \`id\` is provided, updates the existing label; otherwise creates a new one. When creating, \`name\` is required. This tool is part of plugin \`Linear\`. 

## 309. `mcp__codex_apps__linear_save_release`

Plan and build products Create or update a release. If \`id\` is provided, updates the existing release; otherwise creates a new one. When creating, \`name\` and \`pipeline\` are required. Release status is modeled as the rele

## 310. `mcp__codex_apps__linear_save_release_note`

Plan and build products Create or update release notes. If \`id\` is provided, updates the existing release notes; otherwise creates a new one. When creating, \`pipeline\` and either \`releases\` or a release range are require

## 311. `mcp__codex_apps__linear_save_status_update`

Plan and build products Create or update a project/initiative status update. Omit \`id\` to create, provide \`id\` to update. This tool is part of plugin \`Linear\`. 

## 312. `mcp__codex_apps__linear_search`

Plan and build products Full-text search across Linear issues, projects, initiatives, and documents, ranked by relevance. Use this for keyword or natural-language queries (e.g. "memory leak in sync engine"). Supports "qu

## 313. `mcp__codex_apps__linear_search_documentation`

Plan and build products Search Linear's documentation to learn about features and usage. This tool is part of plugin \`Linear\`. 

## 314. `mcp__codex_apps__linear_share_issue`

Plan and build products Share an issue with a workspace user who cannot otherwise access it. Use this tool only when the user explicitly asks to share the issue. This tool is part of plugin \`Linear\`. 

## 315. `mcp__codex_apps__linear_submit_diff_review`

Plan and build products Approve a Linear diff, request changes, or submit a review comment. This tool is part of plugin \`Linear\`. 

## 316. `mcp__codex_apps__linear_unshare_issue`

Plan and build products Remove a workspace user's shared access to an issue. Use this tool only when the user explicitly asks to stop sharing the issue. This tool is part of plugin \`Linear\`. 

## 317. `mcp__codex_apps__openai_platform_create_encrypted_d9a2abd7e085`

Use OpenAI Platform when the user wants to create, set up, copy, download, or use an OpenAI API key, including OPENAI_API_KEY or sk-proj keys. Also use it when code, commands, docs, or environment setup in the conversati

## 318. `mcp__codex_apps__openai_platform_list_openai_api_key_targets`

Use OpenAI Platform when the user wants to create, set up, copy, download, or use an OpenAI API key, including OPENAI_API_KEY or sk-proj keys. Also use it when code, commands, docs, or environment setup in the conversati

## 319. `mcp__codex_apps__openai_platform_open_codex_api_key_setup`

Use OpenAI Platform when the user wants to create, set up, copy, download, or use an OpenAI API key, including OPENAI_API_KEY or sk-proj keys. Also use it when code, commands, docs, or environment setup in the conversati

## 320. `mcp__codex_apps__openai_platform_open_dashboard`

Use OpenAI Platform when the user wants to create, set up, copy, download, or use an OpenAI API key, including OPENAI_API_KEY or sk-proj keys. Also use it when code, commands, docs, or environment setup in the conversati

## 321. `mcp__codex_apps__pets_adopt`

Create and manage the user's animated companion pets inside ChatGPT Work mode. Use only for ChatGPT Pets, not real-world animal advice, generic pet images, or pets in other apps. Adopt a shared ChatGPT pet from its opaqu

## 322. `mcp__codex_apps__pets_create_pet`

Create and manage the user's animated companion pets inside ChatGPT Work mode. Use only for ChatGPT Pets, not real-world animal advice, generic pet images, or pets in other apps. Consume a completed prepare_pet_upload se

## 323. `mcp__codex_apps__pets_delete_pet`

Create and manage the user's animated companion pets inside ChatGPT Work mode. Use only for ChatGPT Pets, not real-world animal advice, generic pet images, or pets in other apps. Permanently delete one owned custom ChatG

## 324. `mcp__codex_apps__pets_get_pet_download_link`

Create and manage the user's animated companion pets inside ChatGPT Work mode. Use only for ChatGPT Pets, not real-world animal advice, generic pet images, or pets in other apps. Get a download URL for one built-in or ow

## 325. `mcp__codex_apps__pets_list_pets`

Create and manage the user's animated companion pets inside ChatGPT Work mode. Use only for ChatGPT Pets, not real-world animal advice, generic pet images, or pets in other apps. List one page of built-in and custom Chat

## 326. `mcp__codex_apps__pets_prepare_pet_upload`

Create and manage the user's animated companion pets inside ChatGPT Work mode. Use only for ChatGPT Pets, not real-world animal advice, generic pet images, or pets in other apps. Prepare a user-scoped ChatGPT pet sprite-

## 327. `mcp__codex_apps__pets_select_pet`

Create and manage the user's animated companion pets inside ChatGPT Work mode. Use only for ChatGPT Pets, not real-world animal advice, generic pet images, or pets in other apps. Persist a built-in or owned custom ChatGP

## 328. `mcp__codex_apps__pets_share_pet`

Create and manage the user's animated companion pets inside ChatGPT Work mode. Use only for ChatGPT Pets, not real-world animal advice, generic pet images, or pets in other apps. Create a share link for one owned custom 

## 329. `mcp__codex_apps__pets_unshare_pet`

Create and manage the user's animated companion pets inside ChatGPT Work mode. Use only for ChatGPT Pets, not real-world animal advice, generic pet images, or pets in other apps. Stop sharing one owned custom ChatGPT pet

## 330. `mcp__codex_apps__pets_update_pet`

Create and manage the user's animated companion pets inside ChatGPT Work mode. Use only for ChatGPT Pets, not real-world animal advice, generic pet images, or pets in other apps. Update the name, description, sprite shee

## 331. `mcp__codex_apps__pets_validate_pet_spritesheet`

Create and manage the user's animated companion pets inside ChatGPT Work mode. Use only for ChatGPT Pets, not real-world animal advice, generic pet images, or pets in other apps. Validate a ChatGPT pet PNG or WebP before

## 332. `mcp__codex_apps__plugin_management_get_app_permissions`

Manage plugins, settings, permissions, and connections. Prefer available built-in tools or connected plugins when they fit the task. Proactively search for plugins when an external app, account, or service would material

## 333. `mcp__codex_apps__plugin_management_get_plugin_dependencies`

Manage plugins, settings, permissions, and connections. Prefer available built-in tools or connected plugins when they fit the task. Proactively search for plugins when an external app, account, or service would material

## 334. `mcp__codex_apps__plugin_management_search_plugins`

Manage plugins, settings, permissions, and connections. Prefer available built-in tools or connected plugins when they fit the task. Proactively search for plugins when an external app, account, or service would material

## 335. `mcp__codex_apps__plugin_management_suggest_plugins`

Manage plugins, settings, permissions, and connections. Prefer available built-in tools or connected plugins when they fit the task. Proactively search for plugins when an external app, account, or service would material

## 336. `mcp__codex_apps__plugin_management_uninstall_app`

Manage plugins, settings, permissions, and connections. Prefer available built-in tools or connected plugins when they fit the task. Proactively search for plugins when an external app, account, or service would material

## 337. `mcp__codex_apps__plugin_management_update_app_permissions`

Manage plugins, settings, permissions, and connections. Prefer available built-in tools or connected plugins when they fit the task. Proactively search for plugins when an external app, account, or service would material

## 338. `mcp__codex_apps__safety_settings_get_family_info`

For ChatGPT Parental Controls (your child or teen's settings, features, Study Mode, quiet hours, family setup) and Trusted Contact (setup, status, privacy). Read account state first. Before updates, read the child's cont

## 339. `mcp__codex_apps__safety_settings_get_parental_controls`

For ChatGPT Parental Controls (your child or teen's settings, features, Study Mode, quiet hours, family setup) and Trusted Contact (setup, status, privacy). Read account state first. Before updates, read the child's cont

## 340. `mcp__codex_apps__safety_settings_get_trusted_contact`

For ChatGPT Parental Controls (your child or teen's settings, features, Study Mode, quiet hours, family setup) and Trusted Contact (setup, status, privacy). Read account state first. Before updates, read the child's cont

## 341. `mcp__codex_apps__safety_settings_prepare_parental_02db6ffaefc6`

For ChatGPT Parental Controls (your child or teen's settings, features, Study Mode, quiet hours, family setup) and Trusted Contact (setup, status, privacy). Read account state first. Before updates, read the child's cont

## 342. `mcp__codex_apps__safety_settings_update_parental_control`

For ChatGPT Parental Controls (your child or teen's settings, features, Study Mode, quiet hours, family setup) and Trusted Contact (setup, status, privacy). Read account state first. Before updates, read the child's cont

## 343. `mcp__codex_apps__search_service_web_run`

Tool for accessing the internet. --- ## Examples of different commands available in this tool Examples of different commands available in this tool: * \`system2_search_query\`: {"system2_search_query": [{"q": "What is the 

## 344. `mcp__codex_apps__sites_add_custom_domain`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 345. `mcp__codex_apps__sites_change_site_slug`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 346. `mcp__codex_apps__sites_create_schedule`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 347. `mcp__codex_apps__sites_create_site`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 348. `mcp__codex_apps__sites_create_source_repository_w_7e7b8ba6ef73`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 349. `mcp__codex_apps__sites_deploy_private_site_version`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 350. `mcp__codex_apps__sites_deploy_site_version`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 351. `mcp__codex_apps__sites_generate_siwc_bypass_token`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 352. `mcp__codex_apps__sites_get_deployment_status`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 353. `mcp__codex_apps__sites_get_environment_variables`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 354. `mcp__codex_apps__sites_get_site`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 355. `mcp__codex_apps__sites_get_site_version`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 356. `mcp__codex_apps__sites_get_site_worker_logs`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 357. `mcp__codex_apps__sites_list_custom_domains`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 358. `mcp__codex_apps__sites_list_site_versions`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 359. `mcp__codex_apps__sites_list_sites`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 360. `mcp__codex_apps__sites_read_database_overview`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 361. `mcp__codex_apps__sites_read_database_table_rows`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 362. `mcp__codex_apps__sites_refresh_custom_domain_status`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 363. `mcp__codex_apps__sites_remove_custom_domain`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 364. `mcp__codex_apps__sites_save_site_version`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 365. `mcp__codex_apps__sites_save_version_and_deploy_private`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 366. `mcp__codex_apps__sites_update_environment_variables`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 367. `mcp__codex_apps__sites_update_site_access`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 368. `mcp__codex_apps__sites_update_site_metadata`

Use Sites to build or modify websites, including landing pages, portfolios, dashboards, portals, trackers, hubs, and internal tools. Use Sites skills for local implementation, source preparation, and artifact packaging. 

## 369. `mcp__cua_repl__js`

UI automation through cua_repl using the initialized cua API. Control native apps or browsers on the user’s computer by reading or operating UI. Prefer purpose-built skills, connectors, APIs, or CLIs when available. On t

## 370. `mcp__cua_repl__js_reset`

UI automation through cua_repl using the initialized cua API. Reset the persistent cua_repl JavaScript session. All JavaScript bindings are discarded. The next cua_repl.js call initializes a fresh runtime for the enabled

## 371. `mcp__hive__agent_archive`

Stop an agent and remove it from the floor. The master orchestrator cannot be archived. 

## 372. `mcp__hive__agent_hold`

Hold an agent (queue its incoming messages) or release it. 

## 373. `mcp__hive__agent_interrupt`

Interrupt another agent's current turn. 

## 374. `mcp__hive__agent_start`

Start another agent's CLI session (if it is stopped). 

## 375. `mcp__hive__agent_stop`

Stop another agent's CLI session. It keeps its history and can be started again. 

## 376. `mcp__hive__ask_user`

Ask the human supervisor a question and wait for the answer. 

## 377. `mcp__hive__board_read`

Read the shared plan board (markdown). 

## 378. `mcp__hive__board_write`

Replace the shared plan board (markdown). Read it first and keep what others wrote. 

## 379. `mcp__hive__list_agents`

List agents on the floor with role, status and current activity. 

## 380. `mcp__hive__mod_create`

Build a new mod from a plain-English description. A Mod Builder agent writes it, checks it loads, and it hot-reloads into the floor. 

## 381. `mcp__hive__mod_enable`

Turn a mod on or off. 

## 382. `mcp__hive__mod_list`

List the floor's mods (id, enabled, errors). Mods live in folders under the project's mods/ and <floor data>/mods/; edit their files and they hot-reload. 

## 383. `mcp__hive__roadmap_get`

Read the product roadmap (lanes now/next/later/shipped, live progress from kanban tasks tagged [Rn]). 

## 384. `mcp__hive__roadmap_move`

Move a roadmap item to another lane (e.g. to shipped when done). 

## 385. `mcp__hive__roadmap_remove`

Remove a roadmap item by id. 

## 386. `mcp__hive__roadmap_set`

Replace the whole roadmap. Use to draft it initially. Items get ids R1, R2, … in order. 

## 387. `mcp__hive__roadmap_upsert`

Add a roadmap item (omit id) or update one by id. 

## 388. `mcp__hive__send_message`

Send a message to another agent (by name or id) or to "user". It is delivered as a new turn for that agent. 

## 389. `mcp__hive__spawn_agent`

Create a new agent on the floor. Optionally give it a first prompt. 

## 390. `mcp__hive__task_add`

Add a kanban task. If assignee is set, that agent is notified. 

## 391. `mcp__hive__task_list`

List kanban tasks. 

## 392. `mcp__hive__task_update`

Update a task: status (todo|doing|review|done), assignee, title or detail. 

## 393. `mcp__hive__ui_add_panel`

Add a panel to the current layout for everyone watching, by view id (e.g. grid, kanban, board, timeline, roadmap, or a view from a mod). 

## 394. `mcp__hive__ui_layout`

Switch the layout for everyone watching the floor. Built-ins: ops, plan, focus, roadmap, showcase, mission, deepdive, dashboard, planner, arcade, zen (viewers may also have saved their own). 

## 395. `mcp__node_repl__js`

Use \`js\` for \`node_repl\` execution with persistent, redeclarable top-level bindings, \`js_reset\` to clear bindings, and \`js_add_node_module_dir\` to add package directories. Execute JavaScript in a persistent \`node_repl\` w

## 396. `mcp__node_repl__js_add_node_module_dir`

Use \`js\` for \`node_repl\` execution with persistent, redeclarable top-level bindings, \`js_reset\` to clear bindings, and \`js_add_node_module_dir\` to add package directories. Add an absolute \`node_modules\` directory for pac

## 397. `mcp__node_repl__js_reset`

Use \`js\` for \`node_repl\` execution with persistent, redeclarable top-level bindings, \`js_reset\` to clear bindings, and \`js_add_node_module_dir\` to add package directories. Reset the JavaScript kernel and clear all bindin

## 398. `mcp__openai_api_key_local_confirmation__confirm_ope_8781ece2af3d`

Use confirm_openai_api_key_local_destination after the OpenAI Platform picker returns a key name and target ids. It asks the developer to confirm or edit the local env-file destination before a secret is created or writt

## 399. `read_mcp_resource`

Read a specific resource from an MCP server given the server name and resource URI. 

## 400. `request_plugin_install`

# Suggest a recommended plugin installation Use this tool only when all of the following are true: - The user explicitly asks to use a specific plugin that is not already available in the current context or active \`tools

## 401. `update_goal`

Update the existing goal. Use this tool only to mark the goal achieved or genuinely blocked. Set status to \`complete\` only when the objective has actually been achieved and no required work remains. Set status to \`blocke

## 402. `update_plan`

Updates the task plan. Provide an optional explanation and a list of plan items, each with a step and status. At most one step can be in_progress at a time. 

## 403. `view_image`

View a local image file from the filesystem when visual inspection is needed. Use this for images already available on disk. 

## 404. `web__run`

Tools in the web namespace. Tool for accessing the internet. --- ## Examples of different commands available in this tool Examples of different commands available in this tool: * \`search_query\`: {"search_query": [{"q": "

## 405. `write_stdin`

Writes characters to an existing unified exec session and returns recent output. 
