module.exports = {
    server_name: 'test',
    hypervisor: 'vbox',
    hypervisor_console: 'rdp',
    uid: 'jacob',
    gid: 'jacob',
    driver: 'vbox',
    driver_config: {
        hypervisor: 'vbox'
    },
    external_interface: 'eth0',
    // The path where the libvirt pool is. Do not make relative path. Do not put a slash on the end
    pool_path: '/opt/lp-drives',
    // The path where the ISO storage is. Do not make relative path. Do not put a slash on the end
    iso_path: '/opt/lp-isos',
    // The path where snapshots will be stored. Do not make relative path. Do not put a slash on the end
    snapshot_path: '/home/jacob/labproject-snapshots',
    // Overrides the location of the libvirt binaries
    libvirt_path: "/libvirt/sbin/",
    transport: {
        name: "socket_io_transport",
        config: {
            port: 8090,
            clientkey: 'test'
        }
    }
};
