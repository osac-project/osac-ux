# Compact pagination in mockup lists

Contact: Yifat Friman Menchik, UXD  
Interactive mock: [current VMaaS mockup](https://osac-project.github.io/osac-ux/vmaas-ux-prototype.html?v=38890d7&role=admin)

The **Virtual machines**, **Virtual networks**, **Catalog items**, **Instance types**, and **Disk images** lists use one compact PatternFly pagination pattern. Above and below each list, show the visible item range and total in a dropdown, followed by Previous and Next buttons. The dropdown changes items per page (10, 20, 50, or 100). Previous and Next are disabled at the corresponding boundary. Filtering resets to the first page. Card and table views share the same page state.

![VM list compact pagination](screenshots/latest-ux/vm-pagination.png)

![Catalog list compact pagination](screenshots/latest-ux/catalog-pagination.png)

![Instance types list compact pagination](screenshots/latest-ux/instance-types-pagination.png)

![Disk images list compact pagination](screenshots/latest-ux/disk-images-pagination.png)
