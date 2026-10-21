$path = 'assets\rwanda-plant-variety-list-2025.csv'
$rows = Import-Csv -LiteralPath $path -Encoding UTF8

$nameFixes = @{
  'Maize|6' = 'SC545(10C844)'
  'Maize|33' = 'RAHA02(HP942-15)'
  'Maize|34' = 'RAHA03(ST-50-13)'
  'Maize|35' = 'RAHA04(HP942-12)'
  'Maize|46' = 'PAN 4M-21 (PEX401)'
  'Maize|69' = 'APIS630/Kungahara'
  'Maize|70' = 'APIS610/Imparage'
  'Rice|1' = 'RW-RCE80-01/AGASARO80-L1'
  'Rice|2' = 'RW-RCE89-01/KIGORI89-H1'
  'Rice|3' = 'RW-RCE89-02/KIGORI89-H2'
  'Rice|4' = 'RW-RCE89-03/KIGORI89-H3'
  'Rice|5' = 'RW-RCE89-04/KIGORI89-H4'
  'Rice|6' = 'RW-RCE03-01/TETA03-HM1'
  'Rice|7' = 'RW-RCE03-02/TETA03-HM2'
  'Rice|8' = 'RW-RCE06-01/TETA06-HM1'
  'Rice|9' = 'RW-RCE10-01/TETA10-L1'
  'Rice|10' = 'RW-RCE10-02/TETA10-ML1'
  'Rice|11' = 'RW-RCE10-03/TETA10-HM1'
  'Rice|12' = 'RW-RCE10-04/TETA10-HM2'
  'Rice|13' = 'RW-RCE10-05/TETA10-HM3'
  'Rice|14' = 'RW-RCE10-06/TETA10-HM4'
  'Rice|15' = 'RW-RCE10-07/TETA10-HM5'
  'Rice|16' = 'RW-RCE13-01/AGASARO13-ML1'
  'Rice|17' = 'RW-RCE13-02/KIGORI13-MH1'
  'Rice|18' = 'RW-RCE20-01/TETA20-HM1'
  'Rice|19' = 'RW-RCE20-02/TETA20-HM2'
  'Rice|20' = 'RW-RCE20-03/TETA20-HM3'
  'Rice|25' = 'KF210054 TETA 24-2'
  'Bean|2' = 'RW-BB183 (KAB 06 F2-8-27-5)'
  'Bean|6' = 'RW-CB186 (RWV2350A-2B)'
  'Bean|7' = 'RW-CB189 (RWIBARURA)'
  'Bean|11' = 'RW-CB182 (RWV2352-1A)'
  'Bean|12' = 'RW-CB188 (RWV2352-2)'
  'Bean|13' = 'RW-CB1812 (RWV2357-B-3)'
  'Bean|16' = 'RW-CB1810 (Nyiramagorori)'
  'Cassava|1' = 'NASE14 (RWACASS1501), Gikungu'
  'Cassava|2' = 'NAROCA SS1 (RWACASS1601), Buryohe'
  'Cassava|3' = 'Ndamirabana/7 (RWACASS1701), Nsizebashonje'
  'Cassava|4' = 'Gahene/2 (RWACASS1702), Tebuka'
  'Cassava|5' = 'MH95/0414/1 (RWACASS1703)'
  'Cassava|6' = 'Bulk 13 (RWACASS1801), Biseruka'
  'Cassava|7' = 'Bulk35 (RWACASS1802), Tegereza'
  'Cassava|8' = 'MM96/8299, Macadamiya'
  'Sweet Potato|1' = 'Giramata (RW11-1860)'
  'Sweet Potato|2' = 'Izihirwe (RW11-2419)'
  'Sweet Potato|3' = 'Maryoha (RW11-17)'
  'Sweet Potato|4' = 'Mbakungahaze (RW11-4923)'
  'Sweet Potato|5' = 'Ndamirabana (RW11-2910)'
  'Sweet Potato|6' = 'RW11-3736'
  'Sweet Potato|7' = 'RW11-5091'
  'Sweet Potato|11' = 'Gihingumukungu'
  'Sweet Potato|13' = 'New Kawogo 193'
  'Sweet Potato|15' = 'RW2005-133'
  'Sweet Potato|16' = 'RW2005-110'
  'Sweet Potato|17' = 'RW2000-038'
  'Sweet Potato|18' = 'RW2002-154'
  'Sweet Potato|19' = 'RW2002-155'
  'Sweet Potato|20' = 'Kyabafurika 538'
  'Sweet Potato|21' = 'RW2000-024'
  'Sweet Potato|22' = 'Kwezikumwe'
  'Sweet Potato|23' = 'Nsasagatebo (Wadada)'
  'Sweet Potato|25' = 'NASPOT9 (Vita)'
  'Sweet Potato|26' = 'Nasot10 (Kabod)'
}

foreach ($row in $rows) {
  $key = "$($row.crop)|$($row.serial_number)"
  $changedName = $false
  if ($nameFixes.ContainsKey($key)) {
    $row.variety_name_synonyms_code_type = $nameFixes[$key]
    $changedName = $true
  } else {
    $oldName = $row.variety_name_synonyms_code_type
    $newName = $oldName -replace '\s*-\s*', '-'
    $newName = $newName -replace '\s+([),])', '$1'
    $newName = $newName.Trim()
    if ($newName -ne $oldName) { $row.variety_name_synonyms_code_type = $newName; $changedName = $true }
  }
  if ($row.crop -eq 'Sorghum') {
    $row.recommended_agroecological_zone_masl = 'Low and mid altitudes'
    if (-not $row.data_note) { $row | Add-Member -NotePropertyName data_note -NotePropertyValue '' }
    $row.data_note = 'Agroecological zone wording standardized from incomplete source text.'
  }
  if ($key -eq 'Maize|77') {
    if (-not $row.data_note) { $row | Add-Member -NotePropertyName data_note -NotePropertyValue '' }
    $row.data_note = 'The source list skips serial number 76; original numbering is preserved.'
  }
  if ($changedName) {
    if (-not $row.data_note) { $row | Add-Member -NotePropertyName data_note -NotePropertyValue '' }
    $note = 'Variety-name spacing normalized from PDF line wrapping.'
    if ($row.data_note -notlike "*$note*") {
      $row.data_note = (@($row.data_note, $note) | Where-Object { $_ }) -join ' '
    }
  }
  if (-not $row.data_note) { $row | Add-Member -NotePropertyName data_note -NotePropertyValue '' }
}

$rows | Export-Csv -LiteralPath $path -NoTypeInformation -Encoding UTF8
"Updated $($rows.Count) records in $path"
