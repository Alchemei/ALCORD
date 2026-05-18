[Setup]
AppName=ALCORD
AppVersion=1.0.0
DefaultDirName={autopf}\ALCORD
DefaultGroupName=ALCORD
UninstallDisplayIcon={app}\ALCORD.exe
Compression=lzma2
SolidCompression=yes
OutputDir=dist
OutputBaseFilename=ALCORD_Setup_New
SetupIconFile=icon.ico
WizardStyle=modern
LanguageDetectionMethod=locale
ShowLanguageDialog=no

[Languages]
Name: "turkish"; MessagesFile: "compiler:Languages\Turkish.isl"

[Files]
Source: "ALCORD-win32-x64\*"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs ignoreversion

[Icons]
Name: "{group}\ALCORD"; Filename: "{app}\ALCORD.exe"
Name: "{autodesktop}\ALCORD"; Filename: "{app}\ALCORD.exe"

[Run]
Filename: "{app}\ALCORD.exe"; Description: "ALCORD uygulamasını başlat"; Flags: nowait postinstall skipifsilent
