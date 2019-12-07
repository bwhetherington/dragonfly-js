
#!/usr/bin/python3

import os
import signal
import subprocess
import sys


def kill(pid):
    print('Killing pid: {}'.format(pid))
    os.kill(pid, signal.SIGTERM)


def run(cmd):
    out = subprocess.Popen(
        cmd,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT
    )
    stdout, _stderr = out.communicate()
    return stdout.decode('utf-8')


def parse_res(res):
    lines = res.split('\n')
    for line in lines[1:]:
        if len(line) > 0:
            comps = line.split()
            pid = int(comps[0])
            proc = comps[3]
            if proc == 'node':
                yield pid


def main():
    cmd = ['ps', '-a']
    for pid in parse_res(run(cmd)):
        kill(pid)


if __name__ == '__main__':
    main()
