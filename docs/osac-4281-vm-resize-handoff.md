# VM resize via instance type

Contact: Yifat Friman Menchik, UXD  
Updated: 12 November 2026

UX Google Doc: https://docs.google.com/document/d/1kgln_LzTA3-VSP0SUM0jLce2Nvw0pix3oTYkwZuX-wE/edit  
Interactive mockup: https://osac-project.github.io/osac-ux/vmaas-ux-prototype.html?v=38890d7&role=admin&vm=windows-golden-eider-58
Feature: [OSAC-4277](https://redhat.atlassian.net/browse/OSAC-4277)  
Resize: [OSAC-4281](https://redhat.atlassian.net/browse/OSAC-4281)  
Related work: [OSAC-7576](https://redhat.atlassian.net/browse/OSAC-7576), [OSAC-7463](https://redhat.atlassian.net/browse/OSAC-7463), [OSAC-7582](https://redhat.atlassian.net/browse/OSAC-7582), [OSAC-6578](https://redhat.atlassian.net/browse/OSAC-6578)

## Entry and availability

On VM Overview, select the pencil beside Instance type. Tenant Admin and Tenant User can resize. The action is available for Running, Paused, and Stopped VMs, and unavailable during transitional states, while a resize is scheduled or applying, or while a failed resize is being resolved.

## Select an instance type

The modal has a required typeahead Instance type field and Save/Cancel actions. Each option shows the instance type name on the first line and CPU, memory, GPU count and readable model, and rate in the description below. For example: **small-gpu** followed by `1 vCPU · 2 GiB memory · 1 GPU (NVIDIA A100 40 GB) · $1.90/hr`. Omit PCI IDs from the visible description; use the GPU count, resource name, and PCI selector for compatibility filtering. The VM's GPU configuration cannot change during resize. Do not predict hot-plug or restart from boot-disk access mode before submission. Show submit failures inside the modal.

Allow long instance type names to wrap to two lines, with the resource details still below the name. If the name needs more than two lines, truncate it and reveal the full name on hover and keyboard focus. The full name and resource details remain in the option's accessible name. The mockup includes `instance-type-e2e-resize-cpu-up-memory-down` as an example in both the Instance types list and selection menus.

Show Deprecated instance types as selectable options with a **Deprecated** label and tooltip: “Still available, but being phased out. We recommend an active type.” Omit Obsolete types from the menu. If the VM currently uses an Obsolete type, show it as the current value in the resize form and require the user to choose a different type before saving. Keep the lifecycle label visible after selecting a Deprecated type. The same rule applies in Create VM and Create VM Catalog Item; see [instance type lifecycle selection](instance-type-lifecycle-selection.md).

## After Save

A success toast confirms the saved request. For a Running or Paused VM that requires restart, show a persistent PF6 info notification at the top of VM Overview: **Restart required to apply resize**. Keep the VM's **active** instance type, vCPUs, and memory as the main configuration values, including the CPU and memory totals in Utilization. Under **Scheduled changes**, show current → requested values for instance type, vCPUs, and memory without repeating “Configuration” before each field. Use the expandable alert, collapsed by default to save vertical space. The title stays visible; expanding reveals the description and change list. New scheduled changes reset it to collapsed so the default layout remains compact. A Restart action in the notification is optional and depends on the supported VM action.

On the VM list, retain the normal power status (for example, Running). Add a separate, neutral, outlined PatternFly 6 **Resize scheduled** label beside the VM name. Its tooltip says, “Restart the VM to apply the new CPU and memory.” A Stopped VM's new size applies on its next start.

## Resize in progress

When the API reports that a resize is applying without a restart, keep **Running** as the VM power state and show a separate **Resize in progress** label in card and table views and beside Status on VM Overview. Its tooltip names the requested instance type and explains that it is applying without a restart. Keep the active instance type, CPU, and memory as the main values until the API confirms the new configuration is active. The mockup uses `indigo-quokka-89` for this state.

After the user restarts a VM with a scheduled resize, remove **Restart required** and show the same compact **Resize in progress** label while the resize is still applying, even if the VM power state has returned to **Running**. Its tooltip names the requested instance type and explains that no further restart is needed. The mockup uses `fedora-aqua-barnacle-58` for this state; restarting `azure-baboon-27` also demonstrates the transition.

Do not show a persistent progress notification, timing details, or a Recent activity entry for this brief operation. Remove the progress label only when the API confirms completion, then show the new instance type, CPU, and memory as active values and a brief success toast. Keep configuration progress separate from the VM power state, as required by OSAC-6578. These states require operation phase and active versus requested values from the API; the mockup timer only demonstrates completion and must not be used as production logic. If the operation stalls or fails, keep the current resources visible and show **Resize failed** in the list and VM detail, with a danger notification containing the reason. Do not offer an unsupported recovery action.

The API must expose or allow derivation of both active and requested configuration values, the restart-required condition, the resize operation phase, and a failure reason. Backend acceptance of the update depends on OSAC-5328.

## Current mockup screenshots

**Instance type choices.** The resource name is the primary line and the configuration is the description. This same pattern applies to Create VM and Create VM Catalog Item.

![Name-first instance type picker in the resize modal](screenshots/latest-ux/resize-instance-types.png)

![Long instance type name wraps in the Instance types list](screenshots/latest-ux/instance-type-long-name.png)

![Full instance type name on hover](screenshots/latest-ux/instance-type-long-name-tooltip.png)

**List pagination.** VM card and table views use the compact PatternFly count dropdown with Previous and Next controls.

![Compact VM list pagination](screenshots/latest-ux/vm-pagination.png)

**Instance type lifecycle.** Deprecated remains selectable and labeled; Obsolete is omitted from the menu.

![Deprecated instance type selected for resize](screenshots/instance-type-lifecycle/resize-deprecated.png)

![Current Obsolete type remains visible but cannot be saved unchanged](screenshots/instance-type-lifecycle/legacy-obsolete-current.png)


**Collapsed restart notice.** The title remains visible until the VM restarts.

![Collapsed restart-required notification](screenshots/vm-resize/restart-required-collapsed-current.jpg)

**Restart required.** The active values remain visible until restart.

![Restart-required resize with scheduled changes](screenshots/vm-resize/restart-required-current.jpg)

**Resize applying without restart.** A compact label appears beside the VM status.

![Resize in progress without restart](screenshots/vm-resize/resize-in-progress-no-restart.jpg)

**Progress tooltip.** The requested instance type and phase are visible on focus or hover.

![Resize progress tooltip](screenshots/vm-resize/resize-progress-tooltip.png)

**Resize still applying after restart.** The same label has a phase-specific tooltip.

![Resize in progress after restart](screenshots/vm-resize/resize-in-progress-after-restart.jpg)

**VM table.** Resize scheduled and Resize in progress appear alongside power status.

![VM table with resize status labels and compact pagination](screenshots/latest-ux/vm-table.png)

**Resize failure.** Current resources stay visible; the reason appears in a danger notification.

![Resize failure on VM Overview](screenshots/vm-resize/resize-failed.png)

## Provisioning failure (separate state)

When provisioning fails, show **Failed to provision** in the VM list and overview instead of leaving the VM at Starting. Show the failure reason. Do not invent Stop, Cancel, or Retry actions; add a recovery action only after the backend supports a safe transition. Track this separately in [OSAC-7582](https://redhat.atlassian.net/browse/OSAC-7582).
