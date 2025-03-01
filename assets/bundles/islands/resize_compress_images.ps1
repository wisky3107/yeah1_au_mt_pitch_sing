# Define the TinyPNG API key
$apiKey = "2pb1jdC633wBpZvhn6nh17p1Zvxnl9LM"

# Function to resize an image to 2048x2048 using ImageMagick
function Resize-Image {
    param (
        [string]$filePath
    )

    Write-Host "START"

    $newFilePath = [System.IO.Path]::Combine([System.IO.Path]::GetDirectoryName($filePath), "resized_" + [System.IO.Path]::GetFileName($filePath))
    Write-Host "newFilePath: $newFilePath"
    $arguments = @($filePath, "-resize", "2048x2048>", $newFilePath)

    & magick $arguments

    if (Test-Path $newFilePath) {
        Remove-Item $filePath
        Rename-Item -Path $newFilePath -NewName $filePath
        Write-Output "Resized $filePath"
    } else {
        Write-Error "Failed to resize $filePath"
    }
}

# Function to compress an image using the TinyPNG API
function Compress-Image {
    param (
        [string]$filePath
    )

    $uri = "https://api.tinify.com/shrink"
    $auth = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("api:$apiKey"))

    # Read the image file
    $imageData = [System.IO.File]::ReadAllBytes($filePath)

    # Prepare the request headers
    $headers = @{
        Authorization = "Basic ${auth}"
    }

    Write-Host "Compress-Image: $filePath"
    # Send the image to the TinyPNG API
    $response = Invoke-RestMethod -Uri $uri -Method Post -Headers $headers -Body $imageData -ContentType "application/octet-stream"

    if ($response.error) {
        Write-Error "Error compressing"
        return
    }

    # Get the compressed image URL
    $compressedImageUrl = $response.output.url

    # Download the compressed image and replace the original
    Invoke-RestMethod -Uri $compressedImageUrl -OutFile $filePath
    Write-Output "Compressed and replaced $filePath"
}

# Get all level 1 child folders
$childFolders = Get-ChildItem -Path "." -Directory

foreach ($folder in $childFolders) {
    # Get all image files in the current level 1 child folder
    $imageFiles = Get-ChildItem -Path $folder.FullName -File | Where-Object { $_.Extension -in ".png", ".jpg", ".jpeg" }

    Write-Host "Processing folder: $($folder.FullName)"
    Write-Host "imageFiles: $($imageFiles.Count)"

    # Resize and compress each image file
    foreach ($imageFile in $imageFiles) {
        Resize-Image -filePath $imageFile.FullName
        Compress-Image -filePath $imageFile.FullName
    }
}
