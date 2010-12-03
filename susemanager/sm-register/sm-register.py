#!/usr/bin/python -u
# -*- coding: utf-8 -*-
#
# Copyright (c) 2010 Novell
#
# This software is licensed to you under the GNU General Public License,
# version 2 (GPLv2). There is NO WARRANTY for this software, express or
# implied, including the implied warranties of MERCHANTABILITY or FITNESS
# FOR A PARTICULAR PURPOSE. You should have received a copy of GPLv2
# along with this software; if not, see
# http://www.gnu.org/licenses/old-licenses/gpl-2.0.txt.
#

LOCK = None

if __name__ != '__main__':
  raise ImportError, "module cannot be imported"

import sys
def systemExit(code, msgs=None):
  "Exit with a code and optional message(s). Saved a few lines of code."
  if msgs:
    if type(msgs) not in [type([]), type(())]:
      msgs = (msgs, )
      for msg in msgs:
        sys.stderr.write(str(msg)+'\n')
  sys.exit(code)

try:
  import os
  import socket
  from rhn import rhnLockfile
  from spacewalk.common import CFG, fetchTraceback
  from spacewalk.susemanager import smregister
except KeyboardInterrupt:
  systemExit(0, "\nUser interrupted process.")
except ImportError:
  sys.stderr.write("Unable to find the code tree.\n"
  "Path not correct? \n")

def releaseLOCK():
  global LOCK
  if LOCK:
    LOCK.release()
    LOCK = None

def main():
  # quick check to see if you are a super-user.
  if os.getuid() != 0:
    sys.stderr.write('ERROR: must be root to execute\n')
    sys.exit(8)

  global LOCK
  LOCK = None
  try:
    LOCK = rhnLockfile.Lockfile('/var/run/sm-register.pid')
  except rhnLockfile.LockfileLockedException:
    systemExit(1, "ERROR: attempting to run more than one instance of sm-register Exiting.")

  sync = smregister.Register()
  sync.main()
  releaseLOCK()
  return 0

if __name__ == '__main__':
  try:
    sys.exit(abs(main() or 0))
  except KeyboardInterrupt:
    systemExit(0, "\nUser interrupted process.")
  except SystemExit, e:
    releaseLOCK()
    sys.exit(e.code)
  except Exception, e:
    releaseLOCK()
    raise
