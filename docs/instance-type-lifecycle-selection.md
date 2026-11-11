# Instance type lifecycle in selection menus

Contact: Yifat Friman Menchik, UXD  
Updated: 11 November 2026

Interactive mockup: https://osac-project.github.io/osac-ux/vmaas-ux-prototype.html?v=20261111-obsolete-hidden&role=admin&vm=windows-golden-eider-58

This rule applies to the instance type menus in **Create VM**, **Create VM Catalog Item**, and **Edit instance type** (resize).

- **Active:** selectable without an additional label.
- **Deprecated:** selectable with a **Deprecated** label. On hover or focus, show: “Still available, but being phased out. We recommend an active type.” Keep the label visible after selection.
- **Obsolete:** omit from menus for new VMs, catalog items, and resizes. New targets cannot use an Obsolete type.

An existing VM or catalog item that uses a Deprecated or Obsolete type still displays its current type. Do not silently replace the current value. The UI must receive lifecycle status from the instance type data rather than infer it from the name.

Related: [VM resize handoff](osac-4281-vm-resize-handoff.md) · [OSAC-4281](https://redhat.atlassian.net/browse/OSAC-4281)

## Screenshots

**Create VM:** Deprecated remains labeled after selection.

![Deprecated instance type selected in Create VM](screenshots/instance-type-lifecycle/create-vm-deprecated.png)

**Obsolete:** hidden from all three selection menus. Existing resources still display their current type.
