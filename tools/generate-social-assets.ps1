param(
  [string]$OutDir = "assets/social"
)

$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$outPath = Join-Path $root $OutDir
$iconPath = Join-Path $root "assets/icons/tusk-icon-512.png"

New-Item -ItemType Directory -Force -Path $outPath | Out-Null

function New-Color([int]$a, [int]$r, [int]$g, [int]$b) {
  [System.Drawing.Color]::FromArgb($a, $r, $g, $b)
}

function New-FontSafe([string[]]$families, [float]$size, [System.Drawing.FontStyle]$style) {
  foreach ($family in $families) {
    try {
      return [System.Drawing.Font]::new($family, $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
    } catch {
      continue
    }
  }
  [System.Drawing.Font]::new("Arial", $size, $style, [System.Drawing.GraphicsUnit]::Pixel)
}

function New-RoundRect([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = [System.Drawing.Drawing2D.GraphicsPath]::new()
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  $path
}

function Draw-CenteredString($g, [string]$text, $font, $brush, [System.Drawing.RectangleF]$rect) {
  $format = [System.Drawing.StringFormat]::new()
  $format.Alignment = [System.Drawing.StringAlignment]::Center
  $format.LineAlignment = [System.Drawing.StringAlignment]::Center
  $format.Trimming = [System.Drawing.StringTrimming]::EllipsisCharacter
  $g.DrawString($text, $font, $brush, $rect, $format)
  $format.Dispose()
}

function Draw-Pill($g, [float]$x, [float]$y, [float]$w, [float]$h, [string]$text) {
  $path = New-RoundRect $x $y $w $h 16
  $fill = [System.Drawing.SolidBrush]::new((New-Color 150 14 14 14))
  $stroke = [System.Drawing.Pen]::new((New-Color 180 255 107 53), 2)
  $font = New-FontSafe @("Oswald", "Arial Narrow", "Arial") 24 ([System.Drawing.FontStyle]::Bold)
  $brush = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
  $g.FillPath($fill, $path)
  $g.DrawPath($stroke, $path)
  Draw-CenteredString $g $text $font $brush ([System.Drawing.RectangleF]::new($x, $y + 1, $w, $h))
  $brush.Dispose()
  $font.Dispose()
  $stroke.Dispose()
  $fill.Dispose()
  $path.Dispose()
}

function Draw-Background($g, [int]$w, [int]$h) {
  $rect = [System.Drawing.Rectangle]::new(0, 0, $w, $h)
  $bg = [System.Drawing.Drawing2D.LinearGradientBrush]::new(
    $rect,
    (New-Color 255 10 10 10),
    (New-Color 255 36 9 3),
    18
  )
  $g.FillRectangle($bg, $rect)
  $bg.Dispose()

  $gridPen = [System.Drawing.Pen]::new((New-Color 28 255 255 255), 1)
  for ($x = 0; $x -le $w; $x += 60) {
    $g.DrawLine($gridPen, $x, 0, $x - 120, $h)
  }
  for ($y = 0; $y -le $h; $y += 60) {
    $g.DrawLine($gridPen, 0, $y, $w, $y)
  }
  $gridPen.Dispose()

  $orange = [System.Drawing.SolidBrush]::new((New-Color 205 255 60 0))
  $points = [System.Drawing.Point[]]@(
    [System.Drawing.Point]::new([int]($w * 0.62), 0),
    [System.Drawing.Point]::new($w, 0),
    [System.Drawing.Point]::new($w, $h),
    [System.Drawing.Point]::new([int]($w * 0.49), $h)
  )
  $g.FillPolygon($orange, $points)
  $orange.Dispose()

  $goldPen = [System.Drawing.Pen]::new((New-Color 190 212 168 67), 6)
  $g.DrawLine($goldPen, [int]($w * 0.60), 0, [int]($w * 0.48), $h)
  $goldPen.Dispose()
}

function Draw-OgImage {
  $w = 1200
  $h = 630
  $bmp = [System.Drawing.Bitmap]::new($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

  Draw-Background $g $w $h

  $white = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
  $muted = [System.Drawing.SolidBrush]::new((New-Color 255 190 190 190))
  $orange = [System.Drawing.SolidBrush]::new((New-Color 255 255 60 0))
  $gold = [System.Drawing.SolidBrush]::new((New-Color 255 212 168 67))

  $fontLabel = New-FontSafe @("Segoe UI Semibold", "Arial") 24 ([System.Drawing.FontStyle]::Bold)
  $fontTusk = New-FontSafe @("Impact", "Arial Black", "Arial") 142 ([System.Drawing.FontStyle]::Regular)
  $fontProtocol = New-FontSafe @("Impact", "Arial Black", "Arial") 104 ([System.Drawing.FontStyle]::Regular)
  $fontSub = New-FontSafe @("Segoe UI Semibold", "Arial") 32 ([System.Drawing.FontStyle]::Bold)
  $fontCta = New-FontSafe @("Segoe UI Semibold", "Arial") 28 ([System.Drawing.FontStyle]::Bold)

  $g.DrawString("BAD BOARS CROSSFIT - SASSARI", $fontLabel, $gold, 72, 62)
  $g.DrawString("TUSK", $fontTusk, $white, 70, 118)
  $g.DrawString("PROTOCOL", $fontProtocol, $orange, 75, 250)
  $g.DrawString("29-30 MAGGIO 2026 | BAD BOARS CROSSFIT", $fontSub, $white, 78, 374)

  Draw-Pill $g 78 452 145 54 "10 EVENTI"
  Draw-Pill $g 238 452 135 54 "2 GIORNI"
  Draw-Pill $g 388 452 196 54 "6 CATEGORIE"
  Draw-Pill $g 600 452 132 54 "EPI LIVE"

  $barPath = New-RoundRect 72 546 640 50 10
  $barFill = [System.Drawing.SolidBrush]::new((New-Color 235 255 60 0))
  $g.FillPath($barFill, $barPath)
  $g.DrawString("ISCRIZIONI APERTE - ISCRIVITI SUL SITO", $fontCta, $white, 94, 553)
  $barFill.Dispose()
  $barPath.Dispose()

  if (Test-Path $iconPath) {
    $icon = [System.Drawing.Image]::FromFile($iconPath)
    $dest = [System.Drawing.Rectangle]::new(792, 104, 312, 312)
    $g.DrawImage($icon, $dest)
    $icon.Dispose()
  }

  $fine = [System.Drawing.Pen]::new((New-Color 170 255 255 255), 2)
  $g.DrawRectangle($fine, 34, 34, $w - 68, $h - 68)
  $fine.Dispose()

  $out = Join-Path $outPath "tusk-og-1200x630.png"
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)

  $fontLabel.Dispose()
  $fontTusk.Dispose()
  $fontProtocol.Dispose()
  $fontSub.Dispose()
  $fontCta.Dispose()
  $white.Dispose()
  $muted.Dispose()
  $orange.Dispose()
  $gold.Dispose()
  $g.Dispose()
  $bmp.Dispose()
}

function Draw-StatusImage {
  $w = 1080
  $h = 1920
  $bmp = [System.Drawing.Bitmap]::new($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic

  Draw-Background $g $w $h

  $white = [System.Drawing.SolidBrush]::new([System.Drawing.Color]::White)
  $muted = [System.Drawing.SolidBrush]::new((New-Color 255 210 210 210))
  $orange = [System.Drawing.SolidBrush]::new((New-Color 255 255 60 0))
  $gold = [System.Drawing.SolidBrush]::new((New-Color 255 212 168 67))

  $fontLabel = New-FontSafe @("Segoe UI Semibold", "Arial") 34 ([System.Drawing.FontStyle]::Bold)
  $fontTusk = New-FontSafe @("Impact", "Arial Black", "Arial") 184 ([System.Drawing.FontStyle]::Regular)
  $fontProtocol = New-FontSafe @("Impact", "Arial Black", "Arial") 132 ([System.Drawing.FontStyle]::Regular)
  $fontSub = New-FontSafe @("Segoe UI Semibold", "Arial") 38 ([System.Drawing.FontStyle]::Bold)
  $fontBody = New-FontSafe @("Segoe UI", "Arial") 34 ([System.Drawing.FontStyle]::Regular)
  $fontCta = New-FontSafe @("Segoe UI Semibold", "Arial") 39 ([System.Drawing.FontStyle]::Bold)
  $fontUrl = New-FontSafe @("Segoe UI Semibold", "Arial") 31 ([System.Drawing.FontStyle]::Bold)

  $center = [System.Drawing.StringFormat]::new()
  $center.Alignment = [System.Drawing.StringAlignment]::Center
  $center.LineAlignment = [System.Drawing.StringAlignment]::Center

  if (Test-Path $iconPath) {
    $icon = [System.Drawing.Image]::FromFile($iconPath)
    $g.DrawImage($icon, [System.Drawing.Rectangle]::new(390, 120, 300, 300))
    $icon.Dispose()
  }

  Draw-CenteredString $g "BAD BOARS CROSSFIT - SASSARI" $fontLabel $gold ([System.Drawing.RectangleF]::new(70, 470, 940, 54))
  Draw-CenteredString $g "TUSK" $fontTusk $white ([System.Drawing.RectangleF]::new(70, 545, 940, 170))
  Draw-CenteredString $g "PROTOCOL" $fontProtocol $orange ([System.Drawing.RectangleF]::new(70, 690, 940, 150))
  Draw-CenteredString $g "29-30 MAGGIO 2026" $fontSub $white ([System.Drawing.RectangleF]::new(90, 875, 900, 70))

  $panel = New-RoundRect 110 1010 860 420 22
  $panelFill = [System.Drawing.SolidBrush]::new((New-Color 180 10 10 10))
  $panelStroke = [System.Drawing.Pen]::new((New-Color 150 255 255 255), 2)
  $g.FillPath($panelFill, $panel)
  $g.DrawPath($panelStroke, $panel)
  Draw-CenteredString $g "10 eventi in 2 giorni" $fontSub $white ([System.Drawing.RectangleF]::new(145, 1065, 790, 58))
  Draw-CenteredString $g "6 categorie per ogni livello atletico" $fontBody $muted ([System.Drawing.RectangleF]::new(145, 1160, 790, 58))
  Draw-CenteredString $g "Classifica EPI live in tempo reale" $fontBody $muted ([System.Drawing.RectangleF]::new(145, 1250, 790, 58))
  Draw-CenteredString $g "Iscrizione: 10 EUR al box" $fontBody $muted ([System.Drawing.RectangleF]::new(145, 1340, 790, 58))
  $panel.Dispose()
  $panelFill.Dispose()
  $panelStroke.Dispose()

  $cta = New-RoundRect 120 1540 840 86 18
  $ctaFill = [System.Drawing.SolidBrush]::new((New-Color 235 255 60 0))
  $g.FillPath($ctaFill, $cta)
  Draw-CenteredString $g "APRILO DAL LINK WHATSAPP" $fontCta $white ([System.Drawing.RectangleF]::new(120, 1540, 840, 86))
  $cta.Dispose()
  $ctaFill.Dispose()

  Draw-CenteredString $g "benevolent-narwhal-1c8444.netlify.app/iscriviti.html" $fontUrl $white ([System.Drawing.RectangleF]::new(80, 1670, 920, 60))

  $fine = [System.Drawing.Pen]::new((New-Color 170 255 255 255), 3)
  $g.DrawRectangle($fine, 48, 48, $w - 96, $h - 96)
  $fine.Dispose()

  $out = Join-Path $outPath "tusk-whatsapp-status-1080x1920.png"
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)

  $center.Dispose()
  $fontLabel.Dispose()
  $fontTusk.Dispose()
  $fontProtocol.Dispose()
  $fontSub.Dispose()
  $fontBody.Dispose()
  $fontCta.Dispose()
  $fontUrl.Dispose()
  $white.Dispose()
  $muted.Dispose()
  $orange.Dispose()
  $gold.Dispose()
  $g.Dispose()
  $bmp.Dispose()
}

Draw-OgImage
Draw-StatusImage

Write-Host "Generated:"
Write-Host " - $(Join-Path $outPath 'tusk-og-1200x630.png')"
Write-Host " - $(Join-Path $outPath 'tusk-whatsapp-status-1080x1920.png')"
