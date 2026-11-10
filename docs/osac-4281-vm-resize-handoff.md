# VM resize via instance type

Contact: Yifat Friman Menchik, UXD  
Updated: 10 November 2026

UX Google Doc: https://docs.google.com/document/d/1kgln_LzTA3-VSP0SUM0jLce2Nvw0pix3oTYkwZuX-wE/edit  
Interactive mockup: https://osac-project.github.io/osac-ux/vmaas-ux-prototype.html?v=d94ee4a&role=admin&vm=azure-baboon-27
Feature: [OSAC-4277](https://redhat.atlassian.net/browse/OSAC-4277)  
Resize: [OSAC-4281](https://redhat.atlassian.net/browse/OSAC-4281)  
Follow-up bugs: [OSAC-7576](https://redhat.atlassian.net/browse/OSAC-7576), [OSAC-7463](https://redhat.atlassian.net/browse/OSAC-7463), [OSAC-7582](https://redhat.atlassian.net/browse/OSAC-7582)

## Entry and availability

On VM Overview, select the pencil beside Instance type. Tenant Admin and Tenant User can resize. The action is available for Running, Paused, and Stopped VMs, and unavailable during transitional states.

## Select an instance type

The modal has a required typeahead Instance type field and Save/Cancel actions. Each option shows its name, vCPUs, memory, GPU count and model, and rate. The VM's GPU configuration cannot change during resize. Exclude instance types with a different GPU count or resource. Do not predict hot-plug or restart from boot-disk access mode before submission. Show submit failures inside the modal.

## After Save

A success toast confirms the saved request. For a Running or Paused VM that requires restart, show a persistent PF6 info notification at the top of VM Overview: **Restart required to apply resize**. Keep the VM's **active** instance type, vCPUs, and memory as the main configuration values, including the CPU and memory totals in Utilization. Under **Scheduled changes**, show current → requested values for instance type, vCPUs, and memory without repeating “Configuration” before each field. Use the expandable alert, collapsed by default to save vertical space. The title stays visible; expanding reveals the description and change list. New scheduled changes reset it to collapsed so the default layout remains compact. A Restart action in the notification is optional and depends on the supported VM action.

On the VM list, retain the normal power status (for example, Running). Add a separate, neutral, outlined PatternFly 6 **Resize scheduled** label beside the VM name. Its tooltip says, “Restart the VM to apply the new CPU and memory.” Clear the info notification and label only when the new configuration is confirmed active. A Stopped VM's new size applies on its next start.

The API must expose or allow derivation of both active and requested configuration values and the restart-required condition. Backend acceptance of the update depends on OSAC-5328.

## Current mockup screenshots

**Resize scheduled badge on the VM list.** The tooltip appears on hover or keyboard focus.

![VM list card with Resize scheduled badge](screenshots/vm-resize/resize-scheduled-card.png)

**Resize scheduled badge in the VM table view.**

![VM table row with Resize scheduled badge](screenshots/vm-resize/resize-scheduled-table.png)

**Expanded info notification showing scheduled changes and the active configuration on VM Overview.**

![Resize info notification with current and after-restart values](screenshots/vm-resize/restart-required-overview.png)

**Default collapsed info notification.** The title remains visible, and the toggle opens the scheduled changes.

![Collapsed resize info notification with persistent title](screenshots/vm-resize/restart-required-collapsed.png)

**Utilization before restart shows the active 1 vCPU and 2 GiB.**

![VM utilization using active CPU and memory totals](screenshots/vm-resize/active-utilization.png)

## Provisioning failure (separate state)

When provisioning fails, show **Failed to provision** in the VM list and overview instead of leaving the VM at Starting. Show the failure reason. Do not invent Stop, Cancel, or Retry actions; add a recovery action only after the backend supports a safe transition. Track this separately in [OSAC-7582](https://redhat.atlassian.net/browse/OSAC-7582).
