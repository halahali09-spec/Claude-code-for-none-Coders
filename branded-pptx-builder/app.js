// ============================================================
// BRANDED PRESENTATION BUILDER — app.js
// ============================================================

// ---- State ----
let brands = JSON.parse(localStorage.getItem('pptx-brands') || '[]');
let activeBrand = null;   // the brand object currently in use
let slides = [];           // array of slide objects
let editingIndex = -1;     // index of slide being edited, -1 = new
let dragSrcIndex = null;

// ---- DOM refs ----
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// Steps
const stepEls = $$('.step');
const panels = { 1: $('#step1'), 2: $('#step2'), 3: $('#step3') };

// Step 1
const brandNameInput = $('#brand-name');
const primaryColor = $('#primary-color');
const secondaryColor = $('#secondary-color');
const accentColor = $('#accent-color');
const textColor = $('#text-color');
const bgColor = $('#bg-color');
const brandFont = $('#brand-font');
const brandLogo = $('#brand-logo');
const logoPreview = $('#logo-preview');
const logoPreviewContainer = $('#logo-preview-container');
const savedBrandsList = $('#saved-brands-list');
const saveBrandBtn = $('#save-brand-btn');
const useBrandBtn = $('#use-brand-btn');
const brandFormTitle = $('#brand-form-title');

// Color hex labels
const hexLabels = {
    'primary-color': $('#primary-hex'),
    'secondary-color': $('#secondary-hex'),
    'accent-color': $('#accent-hex'),
    'text-color': $('#text-hex'),
    'bg-color': $('#bg-hex'),
};

// Step 2
const slideTypeButtons = $$('.slide-type-btn');
const slideEditor = $('#slide-editor');
const slideEditorTitle = $('#slide-editor-title');
const slideFields = $('#slide-fields');
const slideDoneBtn = $('#slide-done-btn');
const slideCancelBtn = $('#slide-cancel-btn');
const slidesList = $('#slides-list');
const goToStep3Btn = $('#go-to-step3');
const activeBrandBadge = $('#active-brand-badge');

// Step 3
const previewContainer = $('#preview-container');
const downloadBtn = $('#download-btn');

// ============================================================
// NAVIGATION
// ============================================================
let currentStep = 1;

function goToStep(n) {
    currentStep = n;
    Object.values(panels).forEach(p => p.classList.remove('active'));
    panels[n].classList.add('active');
    stepEls.forEach(el => {
        const s = parseInt(el.dataset.step);
        el.classList.remove('active', 'done');
        if (s === n) el.classList.add('active');
        else if (s < n) el.classList.add('done');
    });
    if (n === 2) renderSlidesList();
    if (n === 3) renderPreview();
}

$('#back-to-step1').addEventListener('click', () => goToStep(1));
$('#go-to-step3').addEventListener('click', () => goToStep(3));
$('#back-to-step2').addEventListener('click', () => goToStep(2));

// ============================================================
// STEP 1 — BRAND MANAGEMENT
// ============================================================

// -- Color hex sync --
['primary-color', 'secondary-color', 'accent-color', 'text-color', 'bg-color'].forEach(id => {
    const input = document.getElementById(id);
    input.addEventListener('input', () => {
        hexLabels[id].textContent = input.value.toUpperCase();
    });
});

// -- Logo handling --
let logoDataURL = null;

brandLogo.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
        logoDataURL = ev.target.result;
        logoPreview.src = logoDataURL;
        logoPreviewContainer.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
});

$('#remove-logo').addEventListener('click', () => {
    logoDataURL = null;
    brandLogo.value = '';
    logoPreviewContainer.classList.add('hidden');
});

// -- Render saved brands --
function renderBrands() {
    if (brands.length === 0) {
        savedBrandsList.innerHTML = '<p class="no-brands">No saved brands yet. Create one below!</p>';
        return;
    }
    savedBrandsList.innerHTML = brands.map((b, i) => `
        <div class="brand-card" data-index="${i}">
            <button class="brand-card-delete" data-index="${i}" title="Delete brand">&times;</button>
            <div class="brand-card-name">${escapeHTML(b.name)}</div>
            <div class="brand-card-colors">
                <div class="brand-card-swatch" style="background:${b.primaryColor}"></div>
                <div class="brand-card-swatch" style="background:${b.secondaryColor}"></div>
                <div class="brand-card-swatch" style="background:${b.accentColor}"></div>
            </div>
        </div>
    `).join('');

    // Click to load
    savedBrandsList.querySelectorAll('.brand-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.classList.contains('brand-card-delete')) return;
            loadBrandIntoForm(brands[parseInt(card.dataset.index)]);
        });
    });

    // Delete
    savedBrandsList.querySelectorAll('.brand-card-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const idx = parseInt(btn.dataset.index);
            brands.splice(idx, 1);
            persistBrands();
            renderBrands();
        });
    });
}

function loadBrandIntoForm(b) {
    brandNameInput.value = b.name;
    primaryColor.value = b.primaryColor;
    secondaryColor.value = b.secondaryColor;
    accentColor.value = b.accentColor;
    textColor.value = b.textColor;
    bgColor.value = b.bgColor;
    brandFont.value = b.font;
    logoDataURL = b.logo || null;
    if (logoDataURL) {
        logoPreview.src = logoDataURL;
        logoPreviewContainer.classList.remove('hidden');
    } else {
        logoPreviewContainer.classList.add('hidden');
    }
    // Update hex labels
    Object.keys(hexLabels).forEach(id => {
        hexLabels[id].textContent = document.getElementById(id).value.toUpperCase();
    });
    brandFormTitle.textContent = 'Edit Brand';
}

function getBrandFromForm() {
    const name = brandNameInput.value.trim();
    if (!name) { alert('Please enter a brand name.'); return null; }
    return {
        name,
        primaryColor: primaryColor.value,
        secondaryColor: secondaryColor.value,
        accentColor: accentColor.value,
        textColor: textColor.value,
        bgColor: bgColor.value,
        font: brandFont.value,
        logo: logoDataURL,
    };
}

function persistBrands() {
    localStorage.setItem('pptx-brands', JSON.stringify(brands));
}

saveBrandBtn.addEventListener('click', () => {
    const b = getBrandFromForm();
    if (!b) return;
    const existingIdx = brands.findIndex(x => x.name.toLowerCase() === b.name.toLowerCase());
    if (existingIdx >= 0) {
        brands[existingIdx] = b;
    } else {
        brands.push(b);
    }
    persistBrands();
    renderBrands();
    brandFormTitle.textContent = 'Edit Brand';
});

useBrandBtn.addEventListener('click', () => {
    const b = getBrandFromForm();
    if (!b) return;
    activeBrand = b;
    activeBrandBadge.textContent = activeBrand.name;
    goToStep(2);
});

renderBrands();

// ============================================================
// STEP 2 — SLIDE BUILDER
// ============================================================

const slideTemplates = {
    'title': {
        label: 'Title Slide',
        fields: [
            { key: 'title', label: 'Title', type: 'text', placeholder: 'Presentation Title' },
            { key: 'subtitle', label: 'Subtitle', type: 'text', placeholder: 'Your name or tagline' },
        ]
    },
    'content': {
        label: 'Content Slide',
        fields: [
            { key: 'heading', label: 'Heading', type: 'text', placeholder: 'Slide heading' },
            { key: 'body', label: 'Body Text', type: 'textarea', placeholder: 'Write your content here...' },
        ]
    },
    'bullets': {
        label: 'Bullet Points',
        fields: [
            { key: 'heading', label: 'Heading', type: 'text', placeholder: 'Slide heading' },
            { key: 'bullets', label: 'Bullet Points (one per line)', type: 'textarea', placeholder: 'First point\nSecond point\nThird point' },
        ]
    },
    'two-column': {
        label: 'Two Columns',
        fields: [
            { key: 'heading', label: 'Heading', type: 'text', placeholder: 'Slide heading' },
            { key: 'left', label: 'Left Column', type: 'textarea', placeholder: 'Left side content...' },
            { key: 'right', label: 'Right Column', type: 'textarea', placeholder: 'Right side content...' },
        ]
    },
    'image': {
        label: 'Image + Text',
        fields: [
            { key: 'heading', label: 'Heading', type: 'text', placeholder: 'Slide heading' },
            { key: 'body', label: 'Text', type: 'textarea', placeholder: 'Description...' },
            { key: 'image', label: 'Image', type: 'file' },
        ]
    },
    'thank-you': {
        label: 'Thank You',
        fields: [
            { key: 'title', label: 'Title', type: 'text', placeholder: 'Thank You!' },
            { key: 'subtitle', label: 'Subtitle / Contact', type: 'text', placeholder: 'email@example.com' },
        ]
    },
};

// -- Open editor for a new slide type --
slideTypeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        editingIndex = -1;
        openSlideEditor(type, {});
    });
});

function openSlideEditor(type, data) {
    const tmpl = slideTemplates[type];
    slideEditorTitle.textContent = editingIndex >= 0 ? `Edit: ${tmpl.label}` : `New: ${tmpl.label}`;
    slideEditor.dataset.type = type;
    slideFields.innerHTML = tmpl.fields.map(f => {
        const val = data[f.key] || '';
        if (f.type === 'textarea') {
            return `<div class="form-group"><label>${f.label}</label><textarea data-key="${f.key}" placeholder="${f.placeholder}">${escapeHTML(val)}</textarea></div>`;
        } else if (f.type === 'file') {
            const hasImg = data[f.key] ? `<img src="${data[f.key]}" style="max-width:160px;max-height:90px;border-radius:6px;margin-top:6px;">` : '';
            return `<div class="form-group"><label>${f.label}</label><input type="file" data-key="${f.key}" accept="image/*">${hasImg}</div>`;
        } else {
            return `<div class="form-group"><label>${f.label}</label><input type="text" data-key="${f.key}" value="${escapeHTML(val)}" placeholder="${f.placeholder}"></div>`;
        }
    }).join('');
    slideEditor.classList.remove('hidden');
    // Focus first input
    const firstInput = slideFields.querySelector('input[type="text"], textarea');
    if (firstInput) firstInput.focus();
}

slideCancelBtn.addEventListener('click', () => {
    slideEditor.classList.add('hidden');
    editingIndex = -1;
});

slideDoneBtn.addEventListener('click', async () => {
    const type = slideEditor.dataset.type;
    const tmpl = slideTemplates[type];
    const data = {};
    for (const f of tmpl.fields) {
        const el = slideFields.querySelector(`[data-key="${f.key}"]`);
        if (f.type === 'file') {
            if (el.files && el.files[0]) {
                data[f.key] = await fileToDataURL(el.files[0]);
            } else if (editingIndex >= 0 && slides[editingIndex].data[f.key]) {
                data[f.key] = slides[editingIndex].data[f.key];
            }
        } else {
            data[f.key] = el.value;
        }
    }
    if (editingIndex >= 0) {
        slides[editingIndex] = { type, data };
    } else {
        slides.push({ type, data });
    }
    editingIndex = -1;
    slideEditor.classList.add('hidden');
    renderSlidesList();
});

function renderSlidesList() {
    goToStep3Btn.disabled = slides.length === 0;
    if (slides.length === 0) {
        slidesList.innerHTML = '<p class="no-brands">No slides yet. Click a slide type above to add one.</p>';
        return;
    }
    slidesList.innerHTML = slides.map((s, i) => {
        const tmpl = slideTemplates[s.type];
        const title = s.data.title || s.data.heading || tmpl.label;
        return `
        <div class="slide-item" draggable="true" data-index="${i}">
            <div class="slide-item-number">${i + 1}</div>
            <div class="slide-item-info">
                <div class="slide-item-type">${tmpl.label}</div>
                <div class="slide-item-title">${escapeHTML(title)}</div>
            </div>
            <div class="slide-item-actions">
                <button data-action="edit" data-index="${i}" title="Edit">&#9998;</button>
                <button data-action="delete" data-index="${i}" title="Delete">&times;</button>
            </div>
        </div>`;
    }).join('');

    // Drag & drop
    slidesList.querySelectorAll('.slide-item').forEach(item => {
        item.addEventListener('dragstart', (e) => {
            dragSrcIndex = parseInt(item.dataset.index);
            item.classList.add('dragging');
        });
        item.addEventListener('dragend', () => item.classList.remove('dragging'));
        item.addEventListener('dragover', (e) => e.preventDefault());
        item.addEventListener('drop', (e) => {
            e.preventDefault();
            const destIndex = parseInt(item.dataset.index);
            if (dragSrcIndex !== null && dragSrcIndex !== destIndex) {
                const moved = slides.splice(dragSrcIndex, 1)[0];
                slides.splice(destIndex, 0, moved);
                renderSlidesList();
            }
            dragSrcIndex = null;
        });
    });

    // Edit / Delete buttons
    slidesList.querySelectorAll('[data-action="edit"]').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.index);
            editingIndex = idx;
            openSlideEditor(slides[idx].type, slides[idx].data);
        });
    });
    slidesList.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => {
            slides.splice(parseInt(btn.dataset.index), 1);
            renderSlidesList();
        });
    });
}

// ============================================================
// STEP 3 — PREVIEW & DOWNLOAD
// ============================================================

function renderPreview() {
    previewContainer.innerHTML = slides.map((s, i) => {
        const b = activeBrand;
        let inner = '';

        if (s.type === 'title' || s.type === 'thank-you') {
            inner = `
                <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
                    <div style="font-size:28px;font-weight:700;color:${b.primaryColor};font-family:${b.font};">${escapeHTML(s.data.title || '')}</div>
                    <div style="font-size:16px;color:${b.textColor};margin-top:12px;font-family:${b.font};">${escapeHTML(s.data.subtitle || '')}</div>
                </div>`;
        } else if (s.type === 'content') {
            inner = `
                <div style="font-size:22px;font-weight:700;color:${b.primaryColor};font-family:${b.font};margin-bottom:16px;">${escapeHTML(s.data.heading || '')}</div>
                <div style="font-size:14px;color:${b.textColor};font-family:${b.font};white-space:pre-wrap;flex:1;">${escapeHTML(s.data.body || '')}</div>`;
        } else if (s.type === 'bullets') {
            const bullets = (s.data.bullets || '').split('\n').filter(x => x.trim()).map(x => `<li>${escapeHTML(x)}</li>`).join('');
            inner = `
                <div style="font-size:22px;font-weight:700;color:${b.primaryColor};font-family:${b.font};margin-bottom:16px;">${escapeHTML(s.data.heading || '')}</div>
                <ul style="font-size:14px;color:${b.textColor};font-family:${b.font};padding-left:24px;flex:1;">${bullets}</ul>`;
        } else if (s.type === 'two-column') {
            inner = `
                <div style="font-size:22px;font-weight:700;color:${b.primaryColor};font-family:${b.font};margin-bottom:16px;">${escapeHTML(s.data.heading || '')}</div>
                <div style="display:flex;gap:24px;flex:1;">
                    <div style="flex:1;font-size:13px;color:${b.textColor};font-family:${b.font};white-space:pre-wrap;">${escapeHTML(s.data.left || '')}</div>
                    <div style="flex:1;font-size:13px;color:${b.textColor};font-family:${b.font};white-space:pre-wrap;">${escapeHTML(s.data.right || '')}</div>
                </div>`;
        } else if (s.type === 'image') {
            const imgTag = s.data.image ? `<img src="${s.data.image}" style="max-width:45%;max-height:100%;border-radius:6px;object-fit:contain;">` : '';
            inner = `
                <div style="font-size:22px;font-weight:700;color:${b.primaryColor};font-family:${b.font};margin-bottom:16px;">${escapeHTML(s.data.heading || '')}</div>
                <div style="display:flex;gap:24px;flex:1;align-items:center;">
                    <div style="flex:1;font-size:13px;color:${b.textColor};font-family:${b.font};white-space:pre-wrap;">${escapeHTML(s.data.body || '')}</div>
                    ${imgTag}
                </div>`;
        }

        const logoTag = b.logo ? `<img class="preview-slide-logo" src="${b.logo}">` : '';

        return `
        <div class="preview-slide" style="background:${b.bgColor};font-family:${b.font};border-top:6px solid ${b.primaryColor};">
            <span class="preview-slide-number">Slide ${i + 1}</span>
            ${inner}
            ${logoTag}
        </div>`;
    }).join('');
}

// -- DOWNLOAD PPTX --
downloadBtn.addEventListener('click', () => {
    const b = activeBrand;
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
    pptx.author = 'Branded Presentation Builder';

    // Helper: hex to RRGGBB (no #)
    const hex = (c) => c.replace('#', '');

    slides.forEach((s) => {
        const slide = pptx.addSlide();
        slide.background = { color: hex(b.bgColor) };

        // Top accent bar
        slide.addShape(pptx.ShapeType.rect, {
            x: 0, y: 0, w: '100%', h: 0.12,
            fill: { color: hex(b.primaryColor) },
        });

        // Logo
        if (b.logo) {
            slide.addImage({
                data: b.logo,
                x: 11.2, y: 6.6,
                w: 1.5, h: 0.6,
                sizing: { type: 'contain', w: 1.5, h: 0.6 },
            });
        }

        if (s.type === 'title' || s.type === 'thank-you') {
            slide.addText(s.data.title || '', {
                x: 0.8, y: 2.0, w: 11.5, h: 1.5,
                fontSize: 36, fontFace: b.font,
                color: hex(b.primaryColor),
                bold: true, align: 'center', valign: 'middle',
            });
            slide.addText(s.data.subtitle || '', {
                x: 0.8, y: 3.5, w: 11.5, h: 1.0,
                fontSize: 20, fontFace: b.font,
                color: hex(b.textColor),
                align: 'center', valign: 'top',
            });
        } else if (s.type === 'content') {
            slide.addText(s.data.heading || '', {
                x: 0.8, y: 0.4, w: 11.5, h: 0.8,
                fontSize: 28, fontFace: b.font,
                color: hex(b.primaryColor),
                bold: true,
            });
            slide.addText(s.data.body || '', {
                x: 0.8, y: 1.4, w: 11.5, h: 5.2,
                fontSize: 16, fontFace: b.font,
                color: hex(b.textColor),
                valign: 'top',
            });
        } else if (s.type === 'bullets') {
            slide.addText(s.data.heading || '', {
                x: 0.8, y: 0.4, w: 11.5, h: 0.8,
                fontSize: 28, fontFace: b.font,
                color: hex(b.primaryColor),
                bold: true,
            });
            const bulletItems = (s.data.bullets || '').split('\n').filter(x => x.trim()).map(text => ({
                text,
                options: { bullet: { type: 'bullet' }, fontSize: 16, fontFace: b.font, color: hex(b.textColor) },
            }));
            if (bulletItems.length > 0) {
                slide.addText(bulletItems, {
                    x: 0.8, y: 1.4, w: 11.5, h: 5.2,
                    valign: 'top',
                });
            }
        } else if (s.type === 'two-column') {
            slide.addText(s.data.heading || '', {
                x: 0.8, y: 0.4, w: 11.5, h: 0.8,
                fontSize: 28, fontFace: b.font,
                color: hex(b.primaryColor),
                bold: true,
            });
            slide.addText(s.data.left || '', {
                x: 0.8, y: 1.4, w: 5.4, h: 5.2,
                fontSize: 15, fontFace: b.font,
                color: hex(b.textColor),
                valign: 'top',
            });
            // Divider line
            slide.addShape(pptx.ShapeType.line, {
                x: 6.5, y: 1.4, w: 0, h: 5.0,
                line: { color: hex(b.accentColor), width: 1 },
            });
            slide.addText(s.data.right || '', {
                x: 6.9, y: 1.4, w: 5.4, h: 5.2,
                fontSize: 15, fontFace: b.font,
                color: hex(b.textColor),
                valign: 'top',
            });
        } else if (s.type === 'image') {
            slide.addText(s.data.heading || '', {
                x: 0.8, y: 0.4, w: 11.5, h: 0.8,
                fontSize: 28, fontFace: b.font,
                color: hex(b.primaryColor),
                bold: true,
            });
            slide.addText(s.data.body || '', {
                x: 0.8, y: 1.4, w: 5.5, h: 5.2,
                fontSize: 15, fontFace: b.font,
                color: hex(b.textColor),
                valign: 'top',
            });
            if (s.data.image) {
                slide.addImage({
                    data: s.data.image,
                    x: 6.8, y: 1.4, w: 5.5, h: 5.0,
                    sizing: { type: 'contain', w: 5.5, h: 5.0 },
                });
            }
        }
    });

    const fileName = (b.name + ' Presentation').replace(/[^a-zA-Z0-9 _-]/g, '');
    pptx.writeFile({ fileName });
});

// ============================================================
// UTILITIES
// ============================================================
function escapeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

function fileToDataURL(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
    });
}
