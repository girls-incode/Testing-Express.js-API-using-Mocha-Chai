@echo off
SET location=%CD%
REM echo %path%
cd "C:\Program Files\MongoDB\Server\4.2\bin"
start call mongod -dbpath c:\data\db
TIMEOUT /T 10
start call mongo
cd %location%
