const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const loading = document.getElementById('loading');
        const resultsSection = document.getElementById('resultsSection');
        const originalPreview = document.getElementById('originalPreview');
        const iconsGrid = document.getElementById('iconsGrid');
        const downloadAllBtn = document.getElementById('downloadAllBtn');
        
        const sizes = [16, 32, 48, 128];
        let resizedImages = {};
        let originalFileName = '';

        // Upload area events
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
        fileInput.addEventListener('change', handleFileSelect);
        downloadAllBtn.addEventListener('click', downloadAll);
        generateBtn.addEventListener('click', generateIcons);
        addSizeBtn.addEventListener('click', addCustomSize);
        customSizeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addCustomSize();
        });

        // Preset buttons
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => selectPreset(btn.dataset.preset));
        });

        // Format checkboxes
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', updateSelectedFormats);
        });

        function selectPreset(preset) {
            // Update active button
            document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelector(`[data-preset="${preset}"]`).classList.add('active');
            
            // Update sizes
            sizes = [...presets[preset]];
            updateSizeTags();
        }

        function addCustomSize() {
            const size = parseInt(customSizeInput.value);
            if (size && size >= 8 && size <= 2048 && !sizes.includes(size)) {
                sizes.push(size);
                sizes.sort((a, b) => a - b);
                updateSizeTags();
                customSizeInput.value = '';
                
                // Switch to custom preset
                document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
            }
        }

        function updateSizeTags() {
            sizeTags.innerHTML = '';
            sizes.forEach(size => {
                const tag = document.createElement('div');
                tag.className = 'size-tag';
                tag.innerHTML = `
                    ${size}px
                    <span class="remove-size" onclick="removeSize(${size})">×</span>
                `;
                sizeTags.appendChild(tag);
            });
        }

        function removeSize(size) {
            sizes = sizes.filter(s => s !== size);
            updateSizeTags();
            
            // Switch to custom preset if modified
            document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
        }

        function updateSelectedFormats() {
            const checkboxes = document.querySelectorAll('input[type="checkbox"]:checked');
            selectedFormats = Array.from(checkboxes).map(cb => cb.value);
        }

        function handleDragOver(e) {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        }

        function handleDragLeave(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        }

        function handleDrop(e) {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                processFile(files[0]);
            }
        }

        function handleFileSelect(e) {
            const file = e.target.files[0];
            if (file) {
                processFile(file);
            }
        }

        function processFile(file) {
            if (!file.type.startsWith('image/')) {
                showError('Please select a valid image file.');
                return;
            }

            originalFileName = file.name.split('.')[0];
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = new Image();
                img.onload = function() {
                    originalImage = img;
                    showOriginalPreview(img);
                    controlsSection.style.display = 'block';
                    updateSizeTags();
                    updateSelectedFormats();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }

        function generateIcons() {
            if (!originalImage) return;
            
            loading.style.display = 'block';
            resultsSection.style.display = 'none';
            generateBtn.disabled = true;
            
            setTimeout(() => {
                resizeImages(originalImage);
            }, 100);
        }

        function showOriginalPreview(img) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Maintain aspect ratio for preview
            const maxSize = 200;
            const ratio = Math.min(maxSize / img.width, maxSize / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            originalPreview.innerHTML = `
                <h3>Original Image</h3>
                <img src="${canvas.toDataURL()}" alt="Original" />
                <p>Size: ${img.width} × ${img.height}px</p>
            `;
        }

        function resizeImages(originalImg) {
            resizedImages = {};
            iconsGrid.innerHTML = '';

            sizes.forEach(size => {
                selectedFormats.forEach(format => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Handle fractional sizes (like watchOS)
                    const actualSize = Math.round(size);
                    canvas.width = actualSize;
                    canvas.height = actualSize;
                    
                    // Use high-quality scaling
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    
                    // Draw the image scaled to fit the square canvas
                    ctx.drawImage(originalImg, 0, 0, actualSize, actualSize);
                    
                    let mimeType = 'image/png';
                    let quality = 1;
                    
                    switch(format) {
                        case 'png':
                            mimeType = 'image/png';
                            break;
                        case 'jpg':
                            mimeType = 'image/jpeg';
                            quality = 0.9;
                            break;
                        case 'webp':
                            mimeType = 'image/webp';
                            quality = 0.9;
                            break;
                    }
                    
                    const dataURL = canvas.toDataURL(mimeType, quality);
                    const key = `${size}_${format}`;
                    resizedImages[key] = dataURL;
                });
            });

            createIconItems();
            loading.style.display = 'none';
            resultsSection.style.display = 'block';
            generateBtn.disabled = false;
        }

        function createIconItems() {
            // Group by size for better organization
            sizes.forEach(size => {
                const iconItem = document.createElement('div');
                iconItem.className = 'icon-item';
                
                // Show preview with first format
                const firstFormat = selectedFormats[0];
                const previewDataURL = resizedImages[`${size}_${firstFormat}`];
                
                let downloadButtons = '';
                selectedFormats.forEach(format => {
                    downloadButtons += `
                        <button class="btn" onclick="downloadIcon(${size}, '${format}')" style="margin: 5px; padding: 8px 16px; font-size: 0.9rem;">
                            💾 ${format.toUpperCase()}
                        </button>
                    `;
                });
                
                iconItem.innerHTML = `
                    <div class="icon-size">${size}×${size}px</div>
                    <div class="icon-preview">
                        <img src="${previewDataURL}" alt="${size}x${size}" style="width: ${Math.min(size, 64)}px; height: ${Math.min(size, 64)}px;" />
                    </div>
                    <div class="icon-dimensions">${selectedFormats.length} format${selectedFormats.length > 1 ? 's' : ''}</div>
                    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 5px;">
                        ${downloadButtons}
                    </div>
                `;
                
                iconsGrid.appendChild(iconItem);
            });
        }

        function downloadIcon(size, format) {
            const key = `${size}_${format}`;
            const link = document.createElement('a');
            link.download = `icon${size}.${format}`;
            link.href = resizedImages[key];
            link.click();
        }

        async function downloadAll() {
            // Show loading state
            const originalText = downloadAllBtn.textContent;
            downloadAllBtn.textContent = '📦 Creating ZIP...';
            downloadAllBtn.disabled = true;

            try {
                const zip = new JSZip();
                
                // Add each resized image to the ZIP
                sizes.forEach(size => {
                    selectedFormats.forEach(format => {
                        const key = `${size}_${format}`;
                        const dataURL = resizedImages[key];
                        const base64Data = dataURL.split(',')[1];
                        zip.file(`icon${size}.${format}`, base64Data, { base64: true });
                    });
                });

                // Generate the ZIP file
                const zipBlob = await zip.generateAsync({ type: 'blob' });
                
                // Create download link
                const link = document.createElement('a');
                link.href = URL.createObjectURL(zipBlob);
                link.download = 'icons.zip';
                link.click();
                
                // Clean up
                URL.revokeObjectURL(link.href);
                
            } catch (error) {
                showError('Failed to create ZIP file. Please try downloading individually.');
                console.error('ZIP creation error:', error);
            } finally {
                // Restore button state
                downloadAllBtn.textContent = originalText;
                downloadAllBtn.disabled = false;
            }
        }

        function showError(message) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = message;
            
            // Remove existing error messages
            const existingErrors = document.querySelectorAll('.error');
            existingErrors.forEach(error => error.remove());
            
            uploadArea.parentNode.insertBefore(errorDiv, uploadArea.nextSibling);
            
            setTimeout(() => errorDiv.remove(), 5000);
    }