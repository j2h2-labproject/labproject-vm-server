# LabProject VM Server

The VM server is the component that does most of the legwork. It interacts with the front-end server and takes requests to do things such as manage virtual machines and switches.

## Installation

Ubuntu:
```
sudo apt-get install qemu-utils libvirt-bin libvirt-dev openvswitch-switch virtualbox
```

You will also need Nodejs and MongoDB.

### Sudo

```
<USER> ALL=(ALL) NOPASSWD: /usr/bin/ovs-vsctl
<USER> ALL=(ALL) NOPASSWD: /sbin/ip
```

## Usage

TODO

## Contributing

Let me know at jacob (at) j2h2.com

## License

This project is licensed under the GNU General Public License (GPL) v3.0
