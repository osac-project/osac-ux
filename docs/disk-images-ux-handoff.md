# Disk images — UX handoff

Contact: Yifat Friman Menchik, UXD  
Google Doc: [Disk images](https://docs.google.com/document/d/1tKrg2Wb2bmD6ny6Iqw87ysnMRwHjj6XmDttc-rv05a4/edit)  
Interactive mock: [Disk images, Cloud provider admin](https://osac-project.github.io/osac-ux/vmaas-ux-prototype.html?v=0c53b14&role=provider)

Disk images are provider-managed references with metadata, visibility, and lifecycle controls. The list uses compact PatternFly pagination above and below the results: an item-range dropdown plus Previous and Next. The dropdown changes items per page (10, 20, 50, or 100). Filtering resets to the first page.

Deprecated disk images remain selectable in Create VM and Create Catalog Item, with a visible **Deprecated** label and an explanation on hover or focus. They may remain Deprecated for a long time, so hiding them would make the state behave like Obsolete. Obsolete images are unavailable as new choices; an existing use remains visible until replaced.

![Disk images list with compact pagination](screenshots/latest-ux/disk-images-list.png)

![Deprecated disk image in the Create VM picker](screenshots/latest-ux/deprecated-disk-image-picker.png)

Follow the [Google UX handoff](https://docs.google.com/document/d/1tKrg2Wb2bmD6ny6Iqw87ysnMRwHjj6XmDttc-rv05a4/edit) for the create, edit, and details flows.
