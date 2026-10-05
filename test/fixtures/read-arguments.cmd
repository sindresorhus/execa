@ECHO off
ECHO first is %1
IF "%~1" == "-f" (
  ECHO file is "%~2"
)
