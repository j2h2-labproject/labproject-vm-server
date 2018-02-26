# LabProject VM Server

The VM server is the component that does most of the legwork. It interacts with the front-end server and takes requests to do things such as manage virtual machines and switches. It does not connect to a database.

## Installation

Ubuntu 16.04 x64:
```
sudo apt-get install qemu-utils libvirt-bin libvirt-dev openvswitch-switch virtualbox
```

You will also need Nodejs.

### Sudo

Certain privileges are required for the user you will run LabProject as to add interfaces and control Open vSwitch. This can be done with sudo.

Add the following to your sudoers file:
```
<USER> ALL=(ALL) NOPASSWD: /usr/bin/ovs-vsctl
<USER> ALL=(ALL) NOPASSWD: /sbin/ip
```

Ensure your user has access to these commands in `$PATH`.

## Usage

```
node vm-server.js
```

The server will listen on the port in the configuration.

> You may need sudo, but the server will drop privileges according to the config.

## Contributing

Let me know at jacob (at) j2h2.com

## License

This project is licensed under the GNU General Public License (GPL) v3.0
