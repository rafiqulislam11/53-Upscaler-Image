/**
 * LUMINA FX STUDIO - CORE ENGINE
 * 4K/8K Upscaler • Gradient Map • Film Grain Noise • Cinematic Blur
 */

(function () {
  'use strict';

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================
  const State = {
    // Current Image Source
    sourceImage: null,
    sourceWidth: 0,
    sourceHeight: 0,
    aspectRatio: 1,

    // Batch Image Queue (Up to 100 Images Simultaneously)
    batchQueue: [],
    batchActiveIndex: 0,
    isBatchDrawerOpen: false,

    // View Mode: 'split' | 'side' | 'processed'
    viewMode: 'split',
    splitRatio: 0.5, // 0.0 to 1.0

    // Zoom & Pan
    zoom: 1.0,
    panX: 0,
    panY: 0,
    isPanning: false,
    panStartX: 0,
    panStartY: 0,

    // Feature Toggles
    features: {
      upscale: true,
      gradient: false,
      noise: false,
      blur: false
    },

    // 1. UPSCALE SETTINGS (100% Customizable)
    upscale: {
      scaleTarget: '4', // '2', '4', '4k', '8k', 'custom'
      customMultiplier: 3.0,
      customWidth: 3840,
      customHeight: 2160,
      lockAspectRatio: true,
      engine: 'neural',  // 'neural', 'cinematic', 'anime', 'mitchell', 'bilinear', 'nearest'
      sharpness: 65,     // 0 - 100
      sharpenSigma: 1.2, // 0.2 - 5.0
      clarity: 45,       // 0 - 100
      vibrance: 25,      // -100 to 100
      denoise: 20,       // 0 - 100
      faceEnhancement: true,
      faceIntensity: 60, // 0 - 100
      ppi: 300           // 72 to 600 PPI
    },

    // 2. GRADIENT SETTINGS (100% Customizable)
    gradient: {
      type: 'linear',    // 'linear', 'radial', 'angular', 'soft-blur', 'liquid', 'abstract'
      preset: 'cyberpunk',
      stops: [
        { color: '#090979', offset: 0, opacity: 100 },
        { color: '#d6249f', offset: 50, opacity: 100 },
        { color: '#28e5ff', offset: 100, opacity: 100 }
      ],
      angle: 135,        // 0 - 360 deg
      focalX: 50,        // 0 - 100 %
      focalY: 50,        // 0 - 100 %
      radialRadius: 70,  // 10 - 200 %
      blendMode: 'overlay', // 'normal', 'overlay', 'soft-light', 'screen', 'multiply', 'color', 'color-dodge', 'luminosity'
      opacity: 85,          // 0 - 100
      contrast: 50,         // 0 - 100
      dither: 15,           // 0 - 100
      invert: false,
      ppi: 300
    },

    // 3. NOISE & FILM GRAIN SETTINGS (100% Customizable)
    noise: {
      type: 'film35',       // 'film35', 'ilford', 'fuji', 'polaroid', 'digital', 'chromatic'
      amount: 35,           // 0 - 100
      size: 1.5,            // 0.5 - 8.0 px
      shadowsGrain: 50,     // 0 - 100
      midtonesGrain: 75,    // 0 - 100 (Analog peak physics)
      highlightsGrain: 25,  // 0 - 100
      dustAndScratches: 10, // 0 - 100
      contrast: 50,         // 0 - 100
      colorVariation: 30,   // 0 - 100
      seed: 12345,
      blendMode: 'overlay', // 'overlay', 'soft-light', 'screen', 'multiply', 'hard-light'
      monochrome: true,
      preserveOriginalColors: true,
      animated: false,
      ppi: 300
    },

    // 4. BLUR SETTINGS (100% Customizable)
    blur: {
      mode: 'gaussian',     // 'gaussian', 'motion', 'tiltshift', 'radial', 'zoom', 'bokeh', 'background'
      radius: 15,           // 0 - 120 px
      angle: 45,            // 0 - 360 deg
      distance: 25,         // 1 - 100 px
      spinCenterX: 50,      // 0 - 100 %
      spinCenterY: 50,      // 0 - 100 %
      radialWhirl: 25,      // -180 to 180 deg
      tiltFocusPos: 50,     // 0 - 100 %
      tiltFocusWidth: 30,   // 5 - 80 %
      tiltAngle: 0,         // 0 - 180 deg
      tiltFeather: 50,      // 0 - 100 %
      bokehThreshold: 75,   // 10 - 98 %
      bokehBoost: 2.0,      // 1.0 - 5.0x
      bokehAperture: 'circle', // 'circle', '5-blade', '6-blade', '8-blade'
      maskMode: 'brush',    // 'brush', 'eraser'
      brushSize: 35,        // 5 - 100 px
      maskCanvas: null,     // offscreen canvas for interactive painting
      preserveEdges: true,
      ppi: 300
    },

    // Export Options
    export: {
      resolution: 'native',
      customWidth: 3840,
      customHeight: 2160,
      lockAspectRatio: true,
      format: 'png',
      quality: 95,
      pngCompression: 8,
      progressiveJpg: true,
      losslessWebp: false,
      tiffCompression: 'deflate',
      ppi: 300,
      filename: 'lumina-master-export'
    },

    // Performance & Animation
    isRendering: false,
    needsRender: false,
    animationFrameId: null,
    renderStartTime: 0
  };

  // Preset definitions for Gradient Maps
  const GRADIENT_PRESETS = {
    cyberpunk: ['#090979', '#d6249f', '#28e5ff'],
    sunset: ['#1b092b', '#db2777', '#f59e0b', '#fef08a'],
    matrix: ['#021a0e', '#059669', '#6ee7b7'],
    vaporwave: ['#2e0854', '#ec4899', '#38bdf8'],
    sepia: ['#1c1006', '#78350f', '#fef3c7'],
    midnight: ['#05051a', '#4338ca', '#c4b5fd'],
    acid: ['#2e1065', '#a855f7', '#84cc16'],
    infrared: ['#0f172a', '#e11d48', '#fecdd3']
  };

  // DOM Elements
  const DOM = {};

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================
  function init() {
    cacheDOMElements();
    bindEvents();
    loadDefaultSample('cyberpunk');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function cacheDOMElements() {
    // Nav elements
    DOM.sampleCyberpunkBtn = document.getElementById('sampleCyberpunkBtn');
    DOM.samplePortraitBtn = document.getElementById('samplePortraitBtn');
    DOM.sampleNatureBtn = document.getElementById('sampleNatureBtn');
    DOM.imageFileInput = document.getElementById('imageFileInput');
    DOM.viewSplitBtn = document.getElementById('viewSplitBtn');
    DOM.viewSideBtn = document.getElementById('viewSideBtn');
    DOM.viewProcessedBtn = document.getElementById('viewProcessedBtn');
    DOM.resetAllBtn = document.getElementById('resetAllBtn');
    DOM.openExportModalBtn = document.getElementById('openExportModalBtn');

    // Tab buttons & panes
    DOM.tabButtons = document.querySelectorAll('.tab-item');
    DOM.tabPanes = document.querySelectorAll('.tab-pane');

    // Toggles
    DOM.toggleUpscale = document.getElementById('toggleUpscale');
    DOM.toggleGradient = document.getElementById('toggleGradient');
    DOM.toggleNoise = document.getElementById('toggleNoise');
    DOM.toggleBlur = document.getElementById('toggleBlur');

    DOM.upscaleTag = document.getElementById('upscaleTag');
    DOM.gradientTag = document.getElementById('gradientTag');
    DOM.noiseTag = document.getElementById('noiseTag');
    DOM.blurTag = document.getElementById('blurTag');

    // Pipeline tags
    DOM.pipeUpscalePill = document.getElementById('pipeUpscalePill');
    DOM.pipeGradientPill = document.getElementById('pipeGradientPill');
    DOM.pipeNoisePill = document.getElementById('pipeNoisePill');
    DOM.pipeBlurPill = document.getElementById('pipeBlurPill');

    // Upscale controls
    DOM.scaleButtons = document.querySelectorAll('.scale-btn');
    DOM.scaleCustomBtn = document.getElementById('scaleCustomBtn');
    DOM.customDimBox = document.getElementById('customDimBox');
    DOM.customMultiplier = document.getElementById('customMultiplier');
    DOM.customMultiplierVal = document.getElementById('customMultiplierVal');
    DOM.customWidthInput = document.getElementById('customWidthInput');
    DOM.customHeightInput = document.getElementById('customHeightInput');
    DOM.aspectLockBtn = document.getElementById('aspectLockBtn');
    DOM.upscaleEngineSelect = document.getElementById('upscaleEngineSelect');
    DOM.upscaleSharpness = document.getElementById('upscaleSharpness');
    DOM.upscaleSharpnessVal = document.getElementById('upscaleSharpnessVal');
    DOM.upscaleSharpenSigma = document.getElementById('upscaleSharpenSigma');
    DOM.upscaleSharpenSigmaVal = document.getElementById('upscaleSharpenSigmaVal');
    DOM.upscaleClarity = document.getElementById('upscaleClarity');
    DOM.upscaleClarityVal = document.getElementById('upscaleClarityVal');
    DOM.upscaleVibrance = document.getElementById('upscaleVibrance');
    DOM.upscaleVibranceVal = document.getElementById('upscaleVibranceVal');
    DOM.upscaleDenoise = document.getElementById('upscaleDenoise');
    DOM.upscaleDenoiseVal = document.getElementById('upscaleDenoiseVal');
    DOM.toggleFaceEnhance = document.getElementById('toggleFaceEnhance');
    DOM.faceIntensityGroup = document.getElementById('faceIntensityGroup');
    DOM.faceIntensity = document.getElementById('faceIntensity');
    DOM.faceIntensityVal = document.getElementById('faceIntensityVal');
    DOM.upscalePpi = document.getElementById('upscalePpi');
    DOM.upscalePpiVal = document.getElementById('upscalePpiVal');
    DOM.ppiChips = document.querySelectorAll('.ppi-chips-row .ppi-chip');

    // Gradient controls
    DOM.gradTypeSelect = document.getElementById('gradTypeSelect');
    DOM.gradientCards = document.querySelectorAll('.grad-card');
    DOM.stopsListContainer = document.getElementById('stopsListContainer');
    DOM.btnAddGradientStop = document.getElementById('btnAddGradientStop');
    DOM.btnExtractImageColors = document.getElementById('btnExtractImageColors');
    DOM.gradAngleGroup = document.getElementById('gradAngleGroup');
    DOM.gradAngle = document.getElementById('gradAngle');
    DOM.gradAngleVal = document.getElementById('gradAngleVal');
    DOM.gradRadialGroup = document.getElementById('gradRadialGroup');
    DOM.gradFocalX = document.getElementById('gradFocalX');
    DOM.gradFocalY = document.getElementById('gradFocalY');
    DOM.gradFocalVal = document.getElementById('gradFocalVal');
    DOM.gradRadialRadius = document.getElementById('gradRadialRadius');
    DOM.gradRadialRadiusVal = document.getElementById('gradRadialRadiusVal');
    DOM.gradBlendModeSelect = document.getElementById('gradBlendModeSelect');
    DOM.gradOpacity = document.getElementById('gradOpacity');
    DOM.gradOpacityVal = document.getElementById('gradOpacityVal');
    DOM.gradContrast = document.getElementById('gradContrast');
    DOM.gradContrastVal = document.getElementById('gradContrastVal');
    DOM.gradDither = document.getElementById('gradDither');
    DOM.gradDitherVal = document.getElementById('gradDitherVal');
    DOM.gradInvert = document.getElementById('gradInvert');
    DOM.btnGenVariations = document.getElementById('btnGenVariations');

    // Noise controls
    DOM.grainChips = document.querySelectorAll('.grain-chip');
    DOM.noiseAmount = document.getElementById('noiseAmount');
    DOM.noiseAmountVal = document.getElementById('noiseAmountVal');
    DOM.noiseSize = document.getElementById('noiseSize');
    DOM.noiseSizeVal = document.getElementById('noiseSizeVal');
    DOM.noiseShadows = document.getElementById('noiseShadows');
    DOM.noiseShadowsVal = document.getElementById('noiseShadowsVal');
    DOM.noiseMidtones = document.getElementById('noiseMidtones');
    DOM.noiseMidtonesVal = document.getElementById('noiseMidtonesVal');
    DOM.noiseHighlights = document.getElementById('noiseHighlights');
    DOM.noiseHighlightsVal = document.getElementById('noiseHighlightsVal');
    DOM.noiseDust = document.getElementById('noiseDust');
    DOM.noiseDustVal = document.getElementById('noiseDustVal');
    DOM.noiseContrast = document.getElementById('noiseContrast');
    DOM.noiseContrastVal = document.getElementById('noiseContrastVal');
    DOM.noiseColorVar = document.getElementById('noiseColorVar');
    DOM.noiseColorVarVal = document.getElementById('noiseColorVarVal');
    DOM.noiseSeedInput = document.getElementById('noiseSeedInput');
    DOM.btnRandomizeNoiseSeed = document.getElementById('btnRandomizeNoiseSeed');
    DOM.noiseBlend = document.getElementById('noiseBlend');
    DOM.noiseMonochrome = document.getElementById('noiseMonochrome');
    DOM.noisePreserveColors = document.getElementById('noisePreserveColors');
    DOM.noiseAnimated = document.getElementById('noiseAnimated');

    // Blur controls
    DOM.blurChips = document.querySelectorAll('.blur-chip');
    DOM.blurRadius = document.getElementById('blurRadius');
    DOM.blurRadiusVal = document.getElementById('blurRadiusVal');
    DOM.motionAngleGroup = document.getElementById('motionAngleGroup');
    DOM.motionAngle = document.getElementById('motionAngle');
    DOM.motionAngleVal = document.getElementById('motionAngleVal');
    DOM.motionDistance = document.getElementById('motionDistance');
    DOM.motionDistanceVal = document.getElementById('motionDistanceVal');
    DOM.radialSpinGroup = document.getElementById('radialSpinGroup');
    DOM.spinCenterX = document.getElementById('spinCenterX');
    DOM.spinCenterY = document.getElementById('spinCenterY');
    DOM.spinCenterVal = document.getElementById('spinCenterVal');
    DOM.radialWhirl = document.getElementById('radialWhirl');
    DOM.radialWhirlVal = document.getElementById('radialWhirlVal');
    DOM.tiltShiftGroup = document.getElementById('tiltShiftGroup');
    DOM.tiltFocusPos = document.getElementById('tiltFocusPos');
    DOM.tiltFocusPosVal = document.getElementById('tiltFocusPosVal');
    DOM.tiltFocusWidth = document.getElementById('tiltFocusWidth');
    DOM.tiltFocusWidthVal = document.getElementById('tiltFocusWidthVal');
    DOM.tiltAngle = document.getElementById('tiltAngle');
    DOM.tiltAngleVal = document.getElementById('tiltAngleVal');
    DOM.tiltFeather = document.getElementById('tiltFeather');
    DOM.tiltFeatherVal = document.getElementById('tiltFeatherVal');
    DOM.bokehGroup = document.getElementById('bokehGroup');
    DOM.bokehThreshold = document.getElementById('bokehThreshold');
    DOM.bokehThresholdVal = document.getElementById('bokehThresholdVal');
    DOM.bokehBoost = document.getElementById('bokehBoost');
    DOM.bokehBoostVal = document.getElementById('bokehBoostVal');
    DOM.bokehApertureSelect = document.getElementById('bokehApertureSelect');
    DOM.maskGroup = document.getElementById('maskGroup');
    DOM.btnMaskBrush = document.getElementById('btnMaskBrush');
    DOM.btnMaskEraser = document.getElementById('btnMaskEraser');
    DOM.btnMaskClear = document.getElementById('btnMaskClear');
    DOM.maskBrushSize = document.getElementById('maskBrushSize');
    DOM.maskBrushSizeVal = document.getElementById('maskBrushSizeVal');
    DOM.blurMaskEdges = document.getElementById('blurMaskEdges');

    // Presets
    DOM.presetCards = document.querySelectorAll('.preset-card');

    // Canvas & Viewport
    DOM.viewportStage = document.getElementById('viewportStage');
    DOM.canvasScrollArea = document.getElementById('canvasScrollArea');
    DOM.canvasViewport = document.getElementById('canvasViewport');
    DOM.splitComparisonContainer = document.getElementById('splitComparisonContainer');
    DOM.sideBySideContainer = document.getElementById('sideBySideContainer');
    DOM.splitDividerLine = document.getElementById('splitDividerLine');
    DOM.originalClipWrapper = document.getElementById('originalClipWrapper');

    DOM.processedCanvas = document.getElementById('processedCanvas');
    DOM.originalCanvas = document.getElementById('originalCanvas');
    DOM.sideOriginalCanvas = document.getElementById('sideOriginalCanvas');
    DOM.sideProcessedCanvas = document.getElementById('sideProcessedCanvas');

    // Zoom & Toolbar
    DOM.zoomInBtn = document.getElementById('zoomInBtn');
    DOM.zoomOutBtn = document.getElementById('zoomOutBtn');
    DOM.zoomFitBtn = document.getElementById('zoomFitBtn');
    DOM.zoomActualBtn = document.getElementById('zoomActualBtn');
    DOM.zoomLevelDisplay = document.getElementById('zoomLevelDisplay');
    DOM.origResLabel = document.getElementById('origResLabel');
    DOM.targetResLabel = document.getElementById('targetResLabel');
    DOM.renderSpeedLabel = document.getElementById('renderSpeedLabel');

    // Drag drop & Toast
    DOM.dropZoneOverlay = document.getElementById('dropZoneOverlay');
    DOM.processingToast = document.getElementById('processingToast');
    DOM.processingStatusText = document.getElementById('processingStatusText');
    DOM.btnCopyClipboard = document.getElementById('btnCopyClipboard');

    // Export Modal
    DOM.exportModal = document.getElementById('exportModal');
    DOM.closeExportModalBtn = document.getElementById('closeExportModalBtn');
    DOM.cancelExportBtn = document.getElementById('cancelExportBtn');
    DOM.startExportDownloadBtn = document.getElementById('startExportDownloadBtn');
    DOM.downloadBtnText = document.getElementById('downloadBtnText');
    DOM.exportFormatSelect = document.getElementById('exportFormatSelect');
    DOM.exportQualitySlider = document.getElementById('exportQualitySlider');
    DOM.exportQualityVal = document.getElementById('exportQualityVal');
    DOM.exportCustomDimBox = document.getElementById('exportCustomDimBox');
    DOM.exportCustomWidth = document.getElementById('exportCustomWidth');
    DOM.exportCustomHeight = document.getElementById('exportCustomHeight');
    DOM.exportAspectLockBtn = document.getElementById('exportAspectLockBtn');
    DOM.exportPngOptions = document.getElementById('exportPngOptions');
    DOM.exportPngCompression = document.getElementById('exportPngCompression');
    DOM.exportPngCompressionVal = document.getElementById('exportPngCompressionVal');
    DOM.exportJpegOptions = document.getElementById('exportJpegOptions');
    DOM.exportProgressiveJpg = document.getElementById('exportProgressiveJpg');
    DOM.exportWebpOptions = document.getElementById('exportWebpOptions');
    DOM.exportLosslessWebp = document.getElementById('exportLosslessWebp');
    DOM.exportTiffOptions = document.getElementById('exportTiffOptions');
    DOM.exportTiffCompression = document.getElementById('exportTiffCompression');
    DOM.exportPpiInput = document.getElementById('exportPpiInput');
    DOM.exportPpiSlider = document.getElementById('exportPpiSlider');
    DOM.exportPpiChips = document.querySelectorAll('[data-export-ppi]');
    DOM.exportFilenameInput = document.getElementById('exportFilenameInput');
    DOM.exportNativeResText = document.getElementById('exportNativeResText');
    DOM.export4kResText = document.getElementById('export4kResText');
    DOM.export8kResText = document.getElementById('export8kResText');
    DOM.summaryDimensionsText = document.getElementById('summaryDimensionsText');
    DOM.summaryMegapixelsText = document.getElementById('summaryMegapixelsText');
    DOM.summaryPipelineText = document.getElementById('summaryPipelineText');
    DOM.exportProgressWrap = document.getElementById('exportProgressWrap');
    DOM.exportProgressStateText = document.getElementById('exportProgressStateText');
    DOM.exportProgressPercent = document.getElementById('exportProgressPercent');
    DOM.exportProgressBarFill = document.getElementById('exportProgressBarFill');

    // Batch Queue & Filmstrip Elements (Up to 100 images)
    DOM.btnBatchToggle = document.getElementById('btnBatchToggle');
    DOM.batchCounterBadge = document.getElementById('batchCounterBadge');
    DOM.batchNavGroup = document.getElementById('batchNavGroup');
    DOM.btnPrevImage = document.getElementById('btnPrevImage');
    DOM.batchNavCounterText = document.getElementById('batchNavCounterText');
    DOM.btnNextImage = document.getElementById('btnNextImage');
    DOM.batchDrawer = document.getElementById('batchDrawer');
    DOM.btnToggleBatchDrawer = document.getElementById('btnToggleBatchDrawer');
    DOM.batchDrawerCountBadge = document.getElementById('batchDrawerCountBadge');
    DOM.batchAddMoreInput = document.getElementById('batchAddMoreInput');
    DOM.btnAddMoreBatchBtn = document.getElementById('btnAddMoreBatchBtn');
    DOM.btnApplyAllFX = document.getElementById('btnApplyAllFX');
    DOM.btnOpenBatchExportModal = document.getElementById('btnOpenBatchExportModal');
    DOM.btnClearBatchQueue = document.getElementById('btnClearBatchQueue');
    DOM.batchFilmstripWrapper = document.getElementById('batchFilmstripWrapper');
    DOM.batchFilmstrip = document.getElementById('batchFilmstrip');

    // Batch Export Modal Dialog Elements
    DOM.batchExportModal = document.getElementById('batchExportModal');
    DOM.closeBatchExportModalBtn = document.getElementById('closeBatchExportModalBtn');
    DOM.batchModalTotalCount = document.getElementById('batchModalTotalCount');
    DOM.batchModalTargetScale = document.getElementById('batchModalTargetScale');
    DOM.batchExportFormatSelect = document.getElementById('batchExportFormatSelect');
    DOM.batchZipNameInput = document.getElementById('batchZipNameInput');
    DOM.batchProgressBox = document.getElementById('batchProgressBox');
    DOM.batchProgressCurrentItem = document.getElementById('batchProgressCurrentItem');
    DOM.batchProgressPercent = document.getElementById('batchProgressPercent');
    DOM.batchProgressBarFill = document.getElementById('batchProgressBarFill');
    DOM.batchProgressSpeed = document.getElementById('batchProgressSpeed');
    DOM.batchProgressEta = document.getElementById('batchProgressEta');
    DOM.cancelBatchExportBtn = document.getElementById('cancelBatchExportBtn');
    DOM.startBatchExportBtn = document.getElementById('startBatchExportBtn');
    DOM.batchDownloadBtnText = document.getElementById('batchDownloadBtnText');

    // Advanced Batch HUD & Recommendations
    DOM.exportBtnMainLabel = document.getElementById('exportBtnMainLabel');
    DOM.batchExportBadge = document.getElementById('batchExportBadge');
    DOM.batchHudBar = document.getElementById('batchHudBar');
    DOM.batchHudCount = document.getElementById('batchHudCount');
    DOM.btnHudProcessBatch = document.getElementById('btnHudProcessBatch');
    DOM.btnHudBatchSettings = document.getElementById('btnHudBatchSettings');
    DOM.hudProcessBtnText = document.getElementById('hudProcessBtnText');
    DOM.batchExportRecommendBanner = document.getElementById('batchExportRecommendBanner');
    DOM.recommendBatchCount = document.getElementById('recommendBatchCount');
    DOM.btnSwitchToBatchModal = document.getElementById('btnSwitchToBatchModal');
    DOM.btnSingleToBatchExport = document.getElementById('btnSingleToBatchExport');
    DOM.batchScaleSelectorGrid = document.getElementById('batchScaleSelectorGrid');
    DOM.batchSyncStudioFX = document.getElementById('batchSyncStudioFX');
    DOM.batchItemsPreviewList = document.getElementById('batchItemsPreviewList');
    DOM.batchModalListCount = document.getElementById('batchModalListCount');

    // Quick Blur Presets
    DOM.blurPresetPills = document.querySelectorAll('.blur-preset-pill');
  }

  // ==========================================================================
  // 10 COHERENT AESTHETIC GRADIENT VARIATIONS
  // ==========================================================================
  const GRADIENT_VARIATIONS = [
    { name: 'Cyberpunk Neon', stops: ['#090979', '#d6249f', '#28e5ff'] },
    { name: 'Sunset Solstice', stops: ['#2d004b', '#e63946', '#ffb703'] },
    { name: 'Arctic Aurora', stops: ['#031926', '#00a896', '#90e0ef'] },
    { name: 'Vintage Kodachrome', stops: ['#2b1810', '#b85d19', '#f4e04d'] },
    { name: 'Tokyo Midnight', stops: ['#120e3d', '#7b2cbf', '#e0aaff'] },
    { name: 'Emerald Forest', stops: ['#081c15', '#2d6a4f', '#74c69d'] },
    { name: 'Rosé Quartz', stops: ['#2b092b', '#c05299', '#ffd6ba'] },
    { name: '80s Synthwave', stops: ['#10002b', '#e01a4f', '#f15bb5'] },
    { name: 'Golden Hour Film', stops: ['#1f1300', '#b5651d', '#ffd166'] },
    { name: 'Acid Infrared', stops: ['#10002b', '#9d0208', '#70e000'] }
  ];

  let currentVariationIndex = 0;

  function renderGradientStopsList() {
    if (!DOM.stopsListContainer) return;
    DOM.stopsListContainer.innerHTML = '';

    State.gradient.stops.forEach((stop, idx) => {
      const card = document.createElement('div');
      card.className = 'stop-row-card';
      card.setAttribute('data-stop-idx', idx);

      const colorVal = typeof stop === 'string' ? stop : (stop.color || '#ffffff');
      const offsetVal = typeof stop === 'object' && stop.offset !== undefined 
        ? stop.offset 
        : Math.round((idx / Math.max(1, State.gradient.stops.length - 1)) * 100);
      const alphaVal = typeof stop === 'object' && stop.opacity !== undefined ? stop.opacity : 100;

      card.innerHTML = `
        <input type="color" class="stop-color-picker" value="${colorVal}" title="Stop ${idx + 1} Color">
        <div class="stop-slider-wrap">
          <div class="stop-slider-labels">
            <span>Offset: <strong class="stop-offset-val">${offsetVal}%</strong></span>
            <span>Alpha: <strong class="stop-alpha-val">${alphaVal}%</strong></span>
          </div>
          <input type="range" class="styled-range stop-offset-slider" min="0" max="100" value="${offsetVal}">
        </div>
        <button type="button" class="btn-remove-stop" title="Remove stop" ${State.gradient.stops.length <= 2 ? 'disabled' : ''}>×</button>
      `;

      const colorInput = card.querySelector('.stop-color-picker');
      const offsetSlider = card.querySelector('.stop-offset-slider');
      const offsetLabel = card.querySelector('.stop-offset-val');
      const removeBtn = card.querySelector('.btn-remove-stop');

      colorInput.addEventListener('input', (e) => {
        if (typeof State.gradient.stops[idx] === 'string') {
          State.gradient.stops[idx] = { color: e.target.value, offset: offsetVal, opacity: alphaVal };
        } else {
          State.gradient.stops[idx].color = e.target.value;
        }
        activateCustomGradient();
      });

      offsetSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value, 10);
        offsetLabel.textContent = `${val}%`;
        if (typeof State.gradient.stops[idx] === 'string') {
          State.gradient.stops[idx] = { color: colorVal, offset: val, opacity: alphaVal };
        } else {
          State.gradient.stops[idx].offset = val;
        }
        activateCustomGradient();
      });

      removeBtn.addEventListener('click', () => {
        if (State.gradient.stops.length <= 2) return;
        State.gradient.stops.splice(idx, 1);
        renderGradientStopsList();
        activateCustomGradient();
      });

      DOM.stopsListContainer.appendChild(card);
    });
  }

  function generateGradientVariations() {
    currentVariationIndex = (currentVariationIndex + 1) % GRADIENT_VARIATIONS.length;
    const variation = GRADIENT_VARIATIONS[currentVariationIndex];
    State.gradient.stops = variation.stops.map((hex, i) => ({
      color: hex,
      offset: Math.round((i / (variation.stops.length - 1)) * 100),
      opacity: 100
    }));
    State.gradient.preset = 'custom';
    renderGradientStopsList();
    activateCustomGradient();
    showToast(`Applied variation: ${variation.name} (${currentVariationIndex + 1}/10)`, 2200);
  }

  function extractImagePalette() {
    if (!State.sourceImage) return;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 64;
    tempCanvas.height = 64;
    const ctx = tempCanvas.getContext('2d');
    ctx.drawImage(State.sourceImage, 0, 0, 64, 64);
    const data = ctx.getImageData(0, 0, 64, 64).data;

    let darkest = { r: 255, g: 255, b: 255, lum: 999 };
    let brightest = { r: 0, g: 0, b: 0, lum: -1 };
    let sumR = 0, sumG = 0, sumB = 0, count = 0;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;
      sumR += r; sumG += g; sumB += b; count++;

      if (lum < darkest.lum) darkest = { r, g, b, lum };
      if (lum > brightest.lum) brightest = { r, g, b, lum };
    }

    const midR = Math.round(sumR / count);
    const midG = Math.round(sumG / count);
    const midB = Math.round(sumB / count);

    const rgbToHexStr = (r, g, b) => '#' + [r, g, b].map(x => Math.min(255, Math.max(0, x)).toString(16).padStart(2, '0')).join('');

    const stop1 = rgbToHexStr(darkest.r, darkest.g, darkest.b);
    const stop2 = rgbToHexStr(midR, midG, midB);
    const stop3 = rgbToHexStr(brightest.r, brightest.g, brightest.b);

    State.gradient.stops = [
      { color: stop1, offset: 0, opacity: 100 },
      { color: stop2, offset: 50, opacity: 100 },
      { color: stop3, offset: 100, opacity: 100 }
    ];
    State.gradient.preset = 'custom';

    renderGradientStopsList();
    activateCustomGradient();
    showToast('Extracted natural color gradient from image!', 2000);
  }

  // ==========================================================================
  // EVENT BINDINGS
  // ==========================================================================
  function bindEvents() {
    // Sample Switchers
    DOM.sampleCyberpunkBtn.addEventListener('click', () => loadDefaultSample('cyberpunk'));
    DOM.samplePortraitBtn.addEventListener('click', () => loadDefaultSample('portrait'));
    DOM.sampleNatureBtn.addEventListener('click', () => loadDefaultSample('nature'));

    // File Input Upload
    DOM.imageFileInput.addEventListener('change', handleFileInput);

    // View Modes
    DOM.viewSplitBtn.addEventListener('click', () => setViewMode('split'));
    DOM.viewSideBtn.addEventListener('click', () => setViewMode('side'));
    DOM.viewProcessedBtn.addEventListener('click', () => setViewMode('processed'));

    // Reset All
    DOM.resetAllBtn.addEventListener('click', resetAllAdjustments);

    // Tab Navigation
    DOM.tabButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Ignore if clicking the toggle switch inside tab
        if (e.target.closest('.tab-toggle-wrap')) return;
        const targetTab = btn.getAttribute('data-tab');
        switchTab(targetTab);
      });
    });

    // Feature On/Off Toggles
    DOM.toggleUpscale.addEventListener('change', (e) => {
      State.features.upscale = e.target.checked;
      DOM.upscaleTag.textContent = e.target.checked ? `${State.upscale.scaleTarget.toUpperCase()}X Active` : 'Off';
      updatePipelineTags();
      requestRender();
    });

    DOM.toggleGradient.addEventListener('change', (e) => {
      State.features.gradient = e.target.checked;
      DOM.gradientTag.textContent = e.target.checked ? 'Active' : 'Off';
      updatePipelineTags();
      requestRender();
    });

    DOM.toggleNoise.addEventListener('change', (e) => {
      State.features.noise = e.target.checked;
      DOM.noiseTag.textContent = e.target.checked ? `${State.noise.amount}%` : 'Off';
      updatePipelineTags();
      handleNoiseAnimation();
      requestRender();
    });

    DOM.toggleBlur.addEventListener('change', (e) => {
      State.features.blur = e.target.checked;
      DOM.blurTag.textContent = e.target.checked ? `${State.blur.radius}px` : 'Off';
      updatePipelineTags();
      requestRender();
    });

    // Upscale controls
    DOM.scaleButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        DOM.scaleButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const scaleVal = btn.getAttribute('data-scale');
        State.upscale.scaleTarget = scaleVal;

        if (scaleVal === 'custom') {
          DOM.customDimBox.style.display = 'block';
          DOM.upscaleTag.textContent = `${State.upscale.customWidth}×${State.upscale.customHeight} Custom`;
        } else {
          DOM.customDimBox.style.display = 'none';
          DOM.upscaleTag.textContent = `${scaleVal.toUpperCase()}${scaleVal === '4k' || scaleVal === '8k' ? '' : 'X'} Active`;
        }

        updateResolutionBadges();
        updatePipelineTags();
        requestRender();
      });
    });

    if (DOM.customMultiplier) {
      setupSlider(DOM.customMultiplier, DOM.customMultiplierVal, 'x', (v) => {
        const mult = parseFloat(v);
        State.upscale.customMultiplier = mult;
        if (State.sourceWidth > 0) {
          State.upscale.customWidth = Math.round(State.sourceWidth * mult);
          State.upscale.customHeight = Math.round(State.sourceHeight * mult);
          DOM.customWidthInput.value = State.upscale.customWidth;
          DOM.customHeightInput.value = State.upscale.customHeight;
          updateResolutionBadges();
          requestRender();
        }
      });
    }

    if (DOM.customWidthInput) {
      DOM.customWidthInput.addEventListener('input', (e) => {
        const w = parseInt(e.target.value, 10) || 64;
        State.upscale.customWidth = w;
        if (State.upscale.lockAspectRatio && State.aspectRatio) {
          State.upscale.customHeight = Math.round(w / State.aspectRatio);
          DOM.customHeightInput.value = State.upscale.customHeight;
        }
        updateResolutionBadges();
        requestRender();
      });
    }

    if (DOM.customHeightInput) {
      DOM.customHeightInput.addEventListener('input', (e) => {
        const h = parseInt(e.target.value, 10) || 64;
        State.upscale.customHeight = h;
        if (State.upscale.lockAspectRatio && State.aspectRatio) {
          State.upscale.customWidth = Math.round(h * State.aspectRatio);
          DOM.customWidthInput.value = State.upscale.customWidth;
        }
        updateResolutionBadges();
        requestRender();
      });
    }

    if (DOM.aspectLockBtn) {
      DOM.aspectLockBtn.addEventListener('click', () => {
        State.upscale.lockAspectRatio = !State.upscale.lockAspectRatio;
        DOM.aspectLockBtn.classList.toggle('locked', State.upscale.lockAspectRatio);
        showToast(State.upscale.lockAspectRatio ? 'Aspect ratio locked' : 'Aspect ratio unlocked', 1500);
      });
    }

    DOM.upscaleEngineSelect.addEventListener('change', (e) => {
      State.upscale.engine = e.target.value;
      requestRender();
    });

    setupSlider(DOM.upscaleSharpness, DOM.upscaleSharpnessVal, '%', (v) => {
      State.upscale.sharpness = parseInt(v, 10);
      requestRender();
    });

    if (DOM.upscaleSharpenSigma) {
      setupSlider(DOM.upscaleSharpenSigma, DOM.upscaleSharpenSigmaVal, '', (v) => {
        State.upscale.sharpenSigma = parseFloat(v);
        requestRender();
      });
    }

    setupSlider(DOM.upscaleClarity, DOM.upscaleClarityVal, '%', (v) => {
      State.upscale.clarity = parseInt(v, 10);
      requestRender();
    });

    if (DOM.upscaleVibrance) {
      setupSlider(DOM.upscaleVibrance, DOM.upscaleVibranceVal, '%', (v) => {
        State.upscale.vibrance = parseInt(v, 10);
        requestRender();
      });
    }

    setupSlider(DOM.upscaleDenoise, DOM.upscaleDenoiseVal, '%', (v) => {
      State.upscale.denoise = parseInt(v, 10);
      requestRender();
    });

    if (DOM.toggleFaceEnhance) {
      DOM.toggleFaceEnhance.addEventListener('change', (e) => {
        State.upscale.faceEnhancement = e.target.checked;
        DOM.faceIntensityGroup.style.display = e.target.checked ? 'block' : 'none';
        requestRender();
      });
    }

    if (DOM.faceIntensity) {
      setupSlider(DOM.faceIntensity, DOM.faceIntensityVal, '%', (v) => {
        State.upscale.faceIntensity = parseInt(v, 10);
        requestRender();
      });
    }

    if (DOM.upscalePpi) {
      setupSlider(DOM.upscalePpi, DOM.upscalePpiVal, ' PPI', (v) => {
        State.upscale.ppi = parseInt(v, 10);
        DOM.ppiChips.forEach(chip => {
          chip.classList.toggle('active', parseInt(chip.getAttribute('data-ppi'), 10) === State.upscale.ppi);
        });
      });
    }

    DOM.ppiChips.forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.ppiChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const ppiVal = parseInt(chip.getAttribute('data-ppi'), 10);
        State.upscale.ppi = ppiVal;
        DOM.upscalePpi.value = ppiVal;
        DOM.upscalePpiVal.textContent = `${ppiVal} PPI`;
      });
    });

    // Gradient Type
    if (DOM.gradTypeSelect) {
      DOM.gradTypeSelect.addEventListener('change', (e) => {
        State.gradient.type = e.target.value;
        const isRadial = e.target.value === 'radial' || e.target.value === 'angular';
        DOM.gradRadialGroup.style.display = isRadial ? 'block' : 'none';
        DOM.gradAngleGroup.style.display = isRadial ? 'none' : 'block';
        requestRender();
      });
    }

    // Dynamic Gradient Stops Initialization
    renderGradientStopsList();

    if (DOM.btnAddGradientStop) {
      DOM.btnAddGradientStop.addEventListener('click', () => {
        if (State.gradient.stops.length >= 8) {
          alert('Maximum 8 color stops supported.');
          return;
        }
        const lastStop = State.gradient.stops[State.gradient.stops.length - 1] || { color: '#ffffff', offset: 100, opacity: 100 };
        const newOffset = Math.min(100, (State.gradient.stops.length * 15) + 30);
        State.gradient.stops.push({
          color: '#00f2fe',
          offset: newOffset,
          opacity: 100
        });
        renderGradientStopsList();
        activateCustomGradient();
      });
    }

    // Gradient Presets
    DOM.gradientCards.forEach(card => {
      card.addEventListener('click', () => {
        DOM.gradientCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const presetKey = card.getAttribute('data-preset');
        State.gradient.preset = presetKey;
        if (GRADIENT_PRESETS[presetKey]) {
          const rawStops = GRADIENT_PRESETS[presetKey];
          State.gradient.stops = rawStops.map((hex, i) => ({
            color: hex,
            offset: Math.round((i / (rawStops.length - 1)) * 100),
            opacity: 100
          }));
          renderGradientStopsList();
        }
        if (!State.features.gradient) {
          State.features.gradient = true;
          DOM.toggleGradient.checked = true;
          DOM.gradientTag.textContent = 'Active';
          updatePipelineTags();
        }
        requestRender();
      });
    });

    DOM.btnExtractImageColors.addEventListener('click', extractImagePalette);

    DOM.gradBlendModeSelect.addEventListener('change', (e) => {
      State.gradient.blendMode = e.target.value;
      requestRender();
    });

    setupSlider(DOM.gradAngle, DOM.gradAngleVal, '°', (v) => {
      State.gradient.angle = parseInt(v, 10);
      requestRender();
    });

    if (DOM.gradFocalX && DOM.gradFocalY) {
      const updateFocal = () => {
        State.gradient.focalX = parseInt(DOM.gradFocalX.value, 10);
        State.gradient.focalY = parseInt(DOM.gradFocalY.value, 10);
        DOM.gradFocalVal.textContent = `${State.gradient.focalX}% / ${State.gradient.focalY}%`;
        requestRender();
      };
      DOM.gradFocalX.addEventListener('input', updateFocal);
      DOM.gradFocalY.addEventListener('input', updateFocal);
    }

    if (DOM.gradRadialRadius) {
      setupSlider(DOM.gradRadialRadius, DOM.gradRadialRadiusVal, '%', (v) => {
        State.gradient.radialRadius = parseInt(v, 10);
        requestRender();
      });
    }

    setupSlider(DOM.gradOpacity, DOM.gradOpacityVal, '%', (v) => {
      State.gradient.opacity = parseInt(v, 10);
      requestRender();
    });

    setupSlider(DOM.gradContrast, DOM.gradContrastVal, '%', (v) => {
      State.gradient.contrast = parseInt(v, 10);
      requestRender();
    });

    if (DOM.gradDither) {
      setupSlider(DOM.gradDither, DOM.gradDitherVal, '%', (v) => {
        State.gradient.dither = parseInt(v, 10);
        requestRender();
      });
    }

    DOM.gradInvert.addEventListener('change', (e) => {
      State.gradient.invert = e.target.checked;
      requestRender();
    });

    if (DOM.btnGenVariations) {
      DOM.btnGenVariations.addEventListener('click', generateGradientVariations);
    }

    // Noise Grain Chips
    DOM.grainChips.forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.grainChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        State.noise.type = chip.getAttribute('data-type');
        if (!State.features.noise) {
          State.features.noise = true;
          DOM.toggleNoise.checked = true;
          DOM.noiseTag.textContent = `${State.noise.amount}%`;
          updatePipelineTags();
        }
        requestRender();
      });
    });

    setupSlider(DOM.noiseAmount, DOM.noiseAmountVal, '%', (v) => {
      State.noise.amount = parseInt(v, 10);
      if (v > 0 && !State.features.noise) {
        State.features.noise = true;
        DOM.toggleNoise.checked = true;
        updatePipelineTags();
      }
      DOM.noiseTag.textContent = State.features.noise ? `${v}%` : 'Off';
      requestRender();
    });

    setupSlider(DOM.noiseSize, DOM.noiseSizeVal, ' px', (v) => {
      State.noise.size = parseFloat(v);
      requestRender();
    });

    if (DOM.noiseShadows) {
      setupSlider(DOM.noiseShadows, DOM.noiseShadowsVal, '%', (v) => {
        State.noise.shadowsGrain = parseInt(v, 10);
        requestRender();
      });
    }

    if (DOM.noiseMidtones) {
      setupSlider(DOM.noiseMidtones, DOM.noiseMidtonesVal, '%', (v) => {
        State.noise.midtonesGrain = parseInt(v, 10);
        requestRender();
      });
    }

    if (DOM.noiseHighlights) {
      setupSlider(DOM.noiseHighlights, DOM.noiseHighlightsVal, '%', (v) => {
        State.noise.highlightsGrain = parseInt(v, 10);
        requestRender();
      });
    }

    if (DOM.noiseDust) {
      setupSlider(DOM.noiseDust, DOM.noiseDustVal, '%', (v) => {
        State.noise.dustAndScratches = parseInt(v, 10);
        requestRender();
      });
    }

    if (DOM.noiseContrast) {
      setupSlider(DOM.noiseContrast, DOM.noiseContrastVal, '%', (v) => {
        State.noise.contrast = parseInt(v, 10);
        requestRender();
      });
    }

    if (DOM.noiseColorVar) {
      setupSlider(DOM.noiseColorVar, DOM.noiseColorVarVal, '%', (v) => {
        State.noise.colorVariation = parseInt(v, 10);
        requestRender();
      });
    }

    if (DOM.btnRandomizeNoiseSeed) {
      DOM.btnRandomizeNoiseSeed.addEventListener('click', () => {
        const nextSeed = Math.floor(Math.random() * 999999);
        State.noise.seed = nextSeed;
        DOM.noiseSeedInput.value = nextSeed;
        requestRender();
      });
    }

    if (DOM.noiseSeedInput) {
      DOM.noiseSeedInput.addEventListener('input', (e) => {
        State.noise.seed = parseInt(e.target.value, 10) || 12345;
        requestRender();
      });
    }

    DOM.noiseBlend.addEventListener('change', (e) => {
      State.noise.blendMode = e.target.value;
      requestRender();
    });

    DOM.noiseMonochrome.addEventListener('change', (e) => {
      State.noise.monochrome = e.target.checked;
      requestRender();
    });

    if (DOM.noisePreserveColors) {
      DOM.noisePreserveColors.addEventListener('change', (e) => {
        State.noise.preserveOriginalColors = e.target.checked;
        requestRender();
      });
    }

    DOM.noiseAnimated.addEventListener('change', (e) => {
      State.noise.animated = e.target.checked;
      handleNoiseAnimation();
    });

    // Blur Chips
    DOM.blurChips.forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.blurChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        State.blur.mode = chip.getAttribute('data-blur');
        updateBlurSubcontrols();
        if (!State.features.blur) {
          State.features.blur = true;
          DOM.toggleBlur.checked = true;
          DOM.blurTag.textContent = `${State.blur.radius}px`;
          updatePipelineTags();
        }
        requestRender();
      });
    });

    setupSlider(DOM.blurRadius, DOM.blurRadiusVal, ' px', (v) => {
      State.blur.radius = parseInt(v, 10);
      if (v > 0 && !State.features.blur) {
        State.features.blur = true;
        DOM.toggleBlur.checked = true;
        updatePipelineTags();
      }
      DOM.blurTag.textContent = State.features.blur ? `${v}px` : 'Off';
      requestRender();
    });

    setupSlider(DOM.motionAngle, DOM.motionAngleVal, '°', (v) => {
      State.blur.angle = parseInt(v, 10);
      requestRender();
    });

    if (DOM.motionDistance) {
      setupSlider(DOM.motionDistance, DOM.motionDistanceVal, ' px', (v) => {
        State.blur.distance = parseInt(v, 10);
        requestRender();
      });
    }

    if (DOM.spinCenterX && DOM.spinCenterY) {
      const updateSpinCenter = () => {
        State.blur.spinCenterX = parseInt(DOM.spinCenterX.value, 10);
        State.blur.spinCenterY = parseInt(DOM.spinCenterY.value, 10);
        DOM.spinCenterVal.textContent = `${State.blur.spinCenterX}% / ${State.blur.spinCenterY}%`;
        requestRender();
      };
      DOM.spinCenterX.addEventListener('input', updateSpinCenter);
      DOM.spinCenterY.addEventListener('input', updateSpinCenter);
    }

    if (DOM.radialWhirl) {
      setupSlider(DOM.radialWhirl, DOM.radialWhirlVal, '°', (v) => {
        State.blur.radialWhirl = parseInt(v, 10);
        requestRender();
      });
    }

    setupSlider(DOM.tiltFocusPos, DOM.tiltFocusPosVal, '%', (v) => {
      State.blur.tiltFocusPos = parseInt(v, 10);
      requestRender();
    });

    setupSlider(DOM.tiltFocusWidth, DOM.tiltFocusWidthVal, '%', (v) => {
      State.blur.tiltFocusWidth = parseInt(v, 10);
      requestRender();
    });

    if (DOM.tiltAngle) {
      setupSlider(DOM.tiltAngle, DOM.tiltAngleVal, '°', (v) => {
        State.blur.tiltAngle = parseInt(v, 10);
        requestRender();
      });
    }

    if (DOM.tiltFeather) {
      setupSlider(DOM.tiltFeather, DOM.tiltFeatherVal, '%', (v) => {
        State.blur.tiltFeather = parseInt(v, 10);
        requestRender();
      });
    }

    setupSlider(DOM.bokehThreshold, DOM.bokehThresholdVal, '%', (v) => {
      State.blur.bokehThreshold = parseInt(v, 10);
      requestRender();
    });

    if (DOM.bokehBoost) {
      setupSlider(DOM.bokehBoost, DOM.bokehBoostVal, 'x', (v) => {
        State.blur.bokehBoost = parseFloat(v);
        requestRender();
      });
    }

    if (DOM.bokehApertureSelect) {
      DOM.bokehApertureSelect.addEventListener('change', (e) => {
        State.blur.bokehAperture = e.target.value;
        requestRender();
      });
    }

    // Mask controls
    if (DOM.btnMaskBrush) {
      DOM.btnMaskBrush.addEventListener('click', () => {
        State.blur.maskMode = 'brush';
        DOM.btnMaskBrush.classList.add('active');
        DOM.btnMaskEraser.classList.remove('active');
      });
    }

    if (DOM.btnMaskEraser) {
      DOM.btnMaskEraser.addEventListener('click', () => {
        State.blur.maskMode = 'eraser';
        DOM.btnMaskEraser.classList.add('active');
        DOM.btnMaskBrush.classList.remove('active');
      });
    }

    if (DOM.btnMaskClear) {
      DOM.btnMaskClear.addEventListener('click', () => {
        State.blur.maskCanvas = null;
        requestRender();
        showToast('Cleared mask', 1500);
      });
    }

    if (DOM.maskBrushSize) {
      setupSlider(DOM.maskBrushSize, DOM.maskBrushSizeVal, ' px', (v) => {
        State.blur.brushSize = parseInt(v, 10);
      });
    }

    DOM.blurMaskEdges.addEventListener('change', (e) => {
      State.blur.preserveEdges = e.target.checked;
      requestRender();
    });

    // Studio Presets
    DOM.presetCards.forEach(card => {
      card.addEventListener('click', () => {
        const action = card.getAttribute('data-preset-action');
        applyStudioPreset(action);
      });
    });

    // Split Screen Divider Drag
    setupSplitDividerDrag();

    // Zoom & Pan Events
    setupPanAndZoom();

    // Drag and Drop Upload
    setupDragAndDrop();

    // Copy to clipboard
    DOM.btnCopyClipboard.addEventListener('click', copyCanvasToClipboard);

    // Export Modal Events (Smart Batch Detection)
    DOM.openExportModalBtn.addEventListener('click', () => {
      if (State.batchQueue.length > 1) {
        openBatchExportModal();
      } else {
        openExportModal();
      }
    });
    DOM.closeExportModalBtn.addEventListener('click', closeExportModal);
    DOM.cancelExportBtn.addEventListener('click', closeExportModal);
    DOM.startExportDownloadBtn.addEventListener('click', executeExportDownload);

    setupSlider(DOM.exportQualitySlider, DOM.exportQualityVal, '%', (v) => {
      State.export.quality = parseInt(v, 10);
      updateExportSummary();
    });

    document.querySelectorAll('input[name="exportResolution"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        State.export.resolution = e.target.value;
        updateExportSummary();
      });
    });

    DOM.exportFormatSelect.addEventListener('change', (e) => {
      const fmt = e.target.value;
      State.export.format = fmt;
      DOM.exportPngOptions.style.display = fmt === 'png' ? 'block' : 'none';
      DOM.exportJpegOptions.style.display = fmt === 'jpeg' ? 'block' : 'none';
      DOM.exportWebpOptions.style.display = fmt === 'webp' ? 'block' : 'none';
      DOM.exportTiffOptions.style.display = fmt === 'tiff' ? 'block' : 'none';
      updateExportSummary();
    });

    if (DOM.exportCustomWidth) {
      DOM.exportCustomWidth.addEventListener('input', (e) => {
        const w = parseInt(e.target.value, 10) || 64;
        State.export.customWidth = w;
        if (State.export.lockAspectRatio && State.aspectRatio) {
          State.export.customHeight = Math.round(w / State.aspectRatio);
          DOM.exportCustomHeight.value = State.export.customHeight;
        }
        updateExportSummary();
      });
    }

    if (DOM.exportCustomHeight) {
      DOM.exportCustomHeight.addEventListener('input', (e) => {
        const h = parseInt(e.target.value, 10) || 64;
        State.export.customHeight = h;
        if (State.export.lockAspectRatio && State.aspectRatio) {
          State.export.customWidth = Math.round(h * State.aspectRatio);
          DOM.exportCustomWidth.value = State.export.customWidth;
        }
        updateExportSummary();
      });
    }

    if (DOM.exportAspectLockBtn) {
      DOM.exportAspectLockBtn.addEventListener('click', () => {
        State.export.lockAspectRatio = !State.export.lockAspectRatio;
        DOM.exportAspectLockBtn.classList.toggle('locked', State.export.lockAspectRatio);
      });
    }

    if (DOM.exportPpiSlider && DOM.exportPpiInput) {
      DOM.exportPpiSlider.addEventListener('input', (e) => {
        const ppiVal = parseInt(e.target.value, 10);
        State.export.ppi = ppiVal;
        DOM.exportPpiInput.value = ppiVal;
        DOM.exportPpiChips.forEach(c => {
          c.classList.toggle('active', parseInt(c.getAttribute('data-export-ppi'), 10) === ppiVal);
        });
        updateExportSummary();
      });

      DOM.exportPpiInput.addEventListener('input', (e) => {
        const ppiVal = parseInt(e.target.value, 10) || 72;
        State.export.ppi = Math.min(600, Math.max(72, ppiVal));
        DOM.exportPpiSlider.value = State.export.ppi;
        DOM.exportPpiChips.forEach(c => {
          c.classList.toggle('active', parseInt(c.getAttribute('data-export-ppi'), 10) === State.export.ppi);
        });
        updateExportSummary();
      });
    }

    DOM.exportPpiChips.forEach(chip => {
      chip.addEventListener('click', () => {
        DOM.exportPpiChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const ppiVal = parseInt(chip.getAttribute('data-export-ppi'), 10);
        State.export.ppi = ppiVal;
        DOM.exportPpiSlider.value = ppiVal;
        DOM.exportPpiInput.value = ppiVal;
        updateExportSummary();
      });
    });

    if (DOM.exportFilenameInput) {
      DOM.exportFilenameInput.addEventListener('input', (e) => {
        State.export.filename = e.target.value;
      });
    }

    // Window resize
    window.addEventListener('resize', debounce(fitCanvasToViewport, 150));

    // Batch Drawer Toggles
    if (DOM.btnBatchToggle) {
      DOM.btnBatchToggle.addEventListener('click', toggleBatchDrawer);
    }
    if (DOM.btnToggleBatchDrawer) {
      DOM.btnToggleBatchDrawer.addEventListener('click', toggleBatchDrawer);
    }

    // Batch Navigation (Canvas HUD Prev/Next)
    if (DOM.btnPrevImage) {
      DOM.btnPrevImage.addEventListener('click', () => navigateBatchImage(-1));
    }
    if (DOM.btnNextImage) {
      DOM.btnNextImage.addEventListener('click', () => navigateBatchImage(1));
    }

    // Batch Drawer Actions
    if (DOM.batchAddMoreInput) {
      DOM.batchAddMoreInput.addEventListener('change', handleBatchAddMoreInput);
    }
    if (DOM.btnApplyAllFX) {
      DOM.btnApplyAllFX.addEventListener('click', applyCurrentFXToAllBatch);
    }
    if (DOM.btnClearBatchQueue) {
      DOM.btnClearBatchQueue.addEventListener('click', clearBatchQueue);
    }

    // Batch Export Modal Events
    if (DOM.btnOpenBatchExportModal) {
      DOM.btnOpenBatchExportModal.addEventListener('click', openBatchExportModal);
    }
    if (DOM.closeBatchExportModalBtn) {
      DOM.closeBatchExportModalBtn.addEventListener('click', closeBatchExportModal);
    }
    if (DOM.cancelBatchExportBtn) {
      DOM.cancelBatchExportBtn.addEventListener('click', closeBatchExportModal);
    }
    if (DOM.startBatchExportBtn) {
      DOM.startBatchExportBtn.addEventListener('click', executeBatchExport);
    }

    // Batch HUD Bar Actions
    if (DOM.btnHudProcessBatch) {
      DOM.btnHudProcessBatch.addEventListener('click', () => {
        openBatchExportModal();
        executeBatchExport();
      });
    }
    if (DOM.btnHudBatchSettings) {
      DOM.btnHudBatchSettings.addEventListener('click', openBatchExportModal);
    }

    // Single modal to Batch modal switchers
    if (DOM.btnSwitchToBatchModal) {
      DOM.btnSwitchToBatchModal.addEventListener('click', () => {
        closeExportModal();
        openBatchExportModal();
      });
    }
    if (DOM.btnSingleToBatchExport) {
      DOM.btnSingleToBatchExport.addEventListener('click', () => {
        closeExportModal();
        openBatchExportModal();
      });
    }

    // Batch Scale Selector Grid (In-Modal scale choices)
    if (DOM.batchScaleSelectorGrid) {
      DOM.batchScaleSelectorGrid.querySelectorAll('.scale-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const scale = btn.getAttribute('data-batch-scale');
          State.upscale.scaleTarget = scale;
          DOM.batchScaleSelectorGrid.querySelectorAll('.scale-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          if (DOM.batchModalTargetScale) {
            const sc = scale.toUpperCase();
            DOM.batchModalTargetScale.textContent = sc === 'NATIVE' ? '1X Native' : sc.includes('K') ? `${sc} UHD` : `${sc}X UHD`;
          }
          renderBatchModalPreviewList();
        });
      });
    }

    // Quick Blur Presets
    if (DOM.blurPresetPills) {
      DOM.blurPresetPills.forEach(pill => {
        pill.addEventListener('click', () => {
          const preset = pill.getAttribute('data-preset');
          applyBlurPreset(preset);
        });
      });
    }

    // Global Keyboard Shortcuts (Arrow Left/Right for batch, Escape for modals)
    window.addEventListener('keydown', handleGlobalKeydown);
  }

  // ==========================================================================
  // QUICK BLUR PRESETS (CINEMATIC BLUR STUDIO)
  // ==========================================================================
  const BLUR_PRESETS = {
    portrait: { mode: 'bokeh', radius: 20, bokehThreshold: 70, bokehBoost: 2.2, label: 'Portrait Bokeh' },
    action: { mode: 'motion', radius: 30, angle: 45, distance: 35, label: 'Speed Streak' },
    tilt: { mode: 'tiltshift', radius: 25, tiltFocusPos: 50, tiltFocusWidth: 25, tiltFeather: 50, label: 'Miniature Toy' },
    vortex: { mode: 'radial', radius: 18, spinCenterX: 50, spinCenterY: 50, radialWhirl: 35, label: 'Radial Whirl' },
    dreamy: { mode: 'gaussian', radius: 35, label: 'Frosted Glow' },
    subtle: { mode: 'gaussian', radius: 6, label: 'Subtle Clean' }
  };

  function applyBlurPreset(presetKey) {
    const p = BLUR_PRESETS[presetKey];
    if (!p) return;

    if (DOM.blurPresetPills) {
      DOM.blurPresetPills.forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-preset') === presetKey);
      });
    }

    State.features.blur = true;
    DOM.toggleBlur.checked = true;

    State.blur.mode = p.mode;
    State.blur.radius = p.radius;
    if (p.angle !== undefined) State.blur.angle = p.angle;
    if (p.distance !== undefined) State.blur.distance = p.distance;
    if (p.tiltFocusPos !== undefined) State.blur.tiltFocusPos = p.tiltFocusPos;
    if (p.tiltFocusWidth !== undefined) State.blur.tiltFocusWidth = p.tiltFocusWidth;
    if (p.tiltFeather !== undefined) State.blur.tiltFeather = p.tiltFeather;
    if (p.bokehThreshold !== undefined) State.blur.bokehThreshold = p.bokehThreshold;
    if (p.bokehBoost !== undefined) State.blur.bokehBoost = p.bokehBoost;
    if (p.radialWhirl !== undefined) State.blur.radialWhirl = p.radialWhirl;

    DOM.blurChips.forEach(c => c.classList.toggle('active', c.getAttribute('data-blur') === State.blur.mode));
    DOM.blurRadius.value = State.blur.radius;
    DOM.blurRadiusVal.textContent = `${State.blur.radius} px`;
    DOM.blurTag.textContent = `${State.blur.radius}px`;

    if (DOM.motionAngle) {
      DOM.motionAngle.value = State.blur.angle;
      DOM.motionAngleVal.textContent = `${State.blur.angle}°`;
    }
    if (DOM.motionDistance) {
      DOM.motionDistance.value = State.blur.distance;
      DOM.motionDistanceVal.textContent = `${State.blur.distance} px`;
    }
    if (DOM.tiltFocusPos) {
      DOM.tiltFocusPos.value = State.blur.tiltFocusPos;
      DOM.tiltFocusPosVal.textContent = `${State.blur.tiltFocusPos}%`;
    }
    if (DOM.tiltFocusWidth) {
      DOM.tiltFocusWidth.value = State.blur.tiltFocusWidth;
      DOM.tiltFocusWidthVal.textContent = `${State.blur.tiltFocusWidth}%`;
    }
    if (DOM.bokehThreshold) {
      DOM.bokehThreshold.value = State.blur.bokehThreshold;
      DOM.bokehThresholdVal.textContent = `${State.blur.bokehThreshold}%`;
    }
    if (DOM.bokehBoost) {
      DOM.bokehBoost.value = State.blur.bokehBoost;
      DOM.bokehBoostVal.textContent = `${State.blur.bokehBoost}x`;
    }

    updateBlurSubcontrols();
    updatePipelineTags();
    requestRender();
    showToast(`Applied blur preset: ${p.label}`, 2000);
  }

  // ==========================================================================
  // BATCH IMAGE QUEUE & FILMSTRIP ENGINE (UP TO 100 IMAGES)
  // ==========================================================================
  function cloneCurrentSettings() {
    return {
      features: Object.assign({}, State.features),
      upscale: Object.assign({}, State.upscale),
      gradient: Object.assign({}, State.gradient, {
        stops: State.gradient.stops.map(s => Object.assign({}, s))
      }),
      noise: Object.assign({}, State.noise),
      blur: Object.assign({}, State.blur)
    };
  }

  function applySettingsToStudio(settings) {
    if (!settings) return;
    if (settings.features) State.features = Object.assign({}, settings.features);
    if (settings.upscale) State.upscale = Object.assign({}, settings.upscale);
    if (settings.gradient) {
      State.gradient = Object.assign({}, settings.gradient);
      if (settings.gradient.stops) {
        State.gradient.stops = settings.gradient.stops.map(s => Object.assign({}, s));
      }
    }
    if (settings.noise) State.noise = Object.assign({}, settings.noise);
    if (settings.blur) State.blur = Object.assign({}, settings.blur);
    syncUIToState();
  }

  function saveActiveItemSettings() {
    if (State.batchQueue[State.batchActiveIndex]) {
      State.batchQueue[State.batchActiveIndex].settings = cloneCurrentSettings();
    }
  }

  function toggleBatchDrawer() {
    if (DOM.batchDrawer) {
      DOM.batchDrawer.classList.toggle('collapsed');
      State.isBatchDrawerOpen = !DOM.batchDrawer.classList.contains('collapsed');
    }
  }

  function addFilesToBatch(fileList, replaceSample = false) {
    const files = Array.from(fileList || []).filter(f => f.type.startsWith('image/'));
    if (files.length === 0) {
      showToast('Please select valid image files (PNG, JPG, WebP, AVIF).', 2500);
      return;
    }

    const onlySample = State.batchQueue.length === 1 && State.batchQueue[0].isSample;
    if (replaceSample && onlySample) {
      State.batchQueue = [];
      State.batchActiveIndex = 0;
    }

    const currentCount = State.batchQueue.length;
    const maxAllowed = 100 - currentCount;
    if (maxAllowed <= 0) {
      showToast('Maximum queue limit reached (100 images). Remove images to add more.', 3000);
      return;
    }

    const filesToLoad = files.slice(0, maxAllowed);
    if (files.length > maxAllowed) {
      showToast(`Adding ${maxAllowed} images (queue limit: 100).`, 3000);
    } else {
      showToast(`Loading ${filesToLoad.length} image${filesToLoad.length > 1 ? 's' : ''}...`);
    }

    [DOM.sampleCyberpunkBtn, DOM.samplePortraitBtn, DOM.sampleNatureBtn].forEach(b => {
      if (b) b.classList.remove('active');
    });

    let loaded = 0;
    const initialLen = State.batchQueue.length;

    filesToLoad.forEach((file) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const item = {
          id: 'img_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
          name: file.name,
          image: img,
          src: url,
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
          aspectRatio: (img.naturalWidth || img.width) / (img.naturalHeight || img.height),
          isSample: false,
          settings: cloneCurrentSettings()
        };
        State.batchQueue.push(item);
        loaded++;

        if (loaded === filesToLoad.length) {
          if (initialLen === 0) {
            setActiveBatchImage(0);
          } else {
            renderFilmstrip();
            updateBatchUI();
          }

          if (State.batchQueue.length > 1 && DOM.batchDrawer && DOM.batchDrawer.classList.contains('collapsed')) {
            DOM.batchDrawer.classList.remove('collapsed');
          }

          showToast(`⚡ ${loaded} image${loaded > 1 ? 's' : ''} loaded! Batch ready for simultaneous 4K/8K ZIP export (${State.batchQueue.length}/100)`, 3000);
        }
      };
      img.onerror = () => {
        loaded++;
        console.warn('Could not load image file:', file.name);
        if (loaded === filesToLoad.length) {
          renderFilmstrip();
          updateBatchUI();
        }
      };
      img.src = url;
    });
  }

  function handleBatchAddMoreInput(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    addFilesToBatch(files, false);
    e.target.value = '';
  }

  function setActiveBatchImage(index) {
    if (index < 0 || index >= State.batchQueue.length) return;
    saveActiveItemSettings();
    State.batchActiveIndex = index;
    const item = State.batchQueue[index];
    State.sourceImage = item.image;
    State.sourceWidth = item.width;
    State.sourceHeight = item.height;
    State.aspectRatio = item.aspectRatio;

    if (item.settings) {
      applySettingsToStudio(item.settings);
    }

    updateResolutionBadges();
    updateBatchUI();
    renderFilmstrip();
    fitCanvasToViewport();
    requestRender();
  }

  function navigateBatchImage(direction) {
    if (State.batchQueue.length <= 1) return;
    const nextIdx = (State.batchActiveIndex + direction + State.batchQueue.length) % State.batchQueue.length;
    setActiveBatchImage(nextIdx);
  }

  function renderFilmstrip() {
    if (!DOM.batchFilmstrip) return;
    DOM.batchFilmstrip.innerHTML = '';

    State.batchQueue.forEach((item, idx) => {
      const card = document.createElement('div');
      card.className = `batch-card ${idx === State.batchActiveIndex ? 'active' : ''}`;
      card.setAttribute('data-index', idx);
      card.title = `${item.name} (${item.width}×${item.height})`;

      card.innerHTML = `
        <span class="batch-card-status" id="batchCardStatus_${idx}">#${idx + 1}</span>
        <button type="button" class="batch-card-remove" title="Remove image">&times;</button>
        <img src="${item.src}" class="batch-thumb-img" alt="${item.name}" loading="lazy" />
        <div class="batch-card-info">
          <span class="batch-card-name">${item.name}</span>
          <div class="batch-card-meta">
            <span>${item.width}×${item.height}</span>
            <span>#${idx + 1}</span>
          </div>
        </div>
      `;

      card.addEventListener('click', (e) => {
        if (e.target.closest('.batch-card-remove')) return;
        setActiveBatchImage(idx);
      });

      const removeBtn = card.querySelector('.batch-card-remove');
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          removeBatchItem(idx);
        });
      }

      DOM.batchFilmstrip.appendChild(card);
    });

    const activeCard = DOM.batchFilmstrip.querySelector('.batch-card.active');
    if (activeCard && DOM.batchFilmstripWrapper) {
      activeCard.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }

  function removeBatchItem(idx) {
    if (idx < 0 || idx >= State.batchQueue.length) return;
    State.batchQueue.splice(idx, 1);
    if (State.batchQueue.length === 0) {
      loadDefaultSample('cyberpunk');
      showToast('Queue is empty. Reset to default sample.', 2000);
      return;
    }

    if (State.batchActiveIndex >= State.batchQueue.length) {
      State.batchActiveIndex = State.batchQueue.length - 1;
    } else if (State.batchActiveIndex > idx) {
      State.batchActiveIndex--;
    }

    setActiveBatchImage(State.batchActiveIndex);
    showToast('Removed image from batch queue', 1500);
  }

  function clearBatchQueue() {
    if (State.batchQueue.length <= 1 && State.batchQueue[0] && State.batchQueue[0].isSample) {
      showToast('Queue already clean.', 1500);
      return;
    }
    State.batchQueue = [];
    loadDefaultSample('cyberpunk');
    showToast('Cleared all images from batch queue', 2000);
  }

  function updateBatchUI() {
    const count = State.batchQueue.length;
    const currentNum = count > 0 ? State.batchActiveIndex + 1 : 0;

    if (DOM.batchCounterBadge) {
      DOM.batchCounterBadge.textContent = count;
    }

    if (DOM.batchDrawerCountBadge) {
      DOM.batchDrawerCountBadge.textContent = `${currentNum} / ${count} Images (Max 100)`;
    }

    if (DOM.batchNavCounterText) {
      DOM.batchNavCounterText.textContent = `${currentNum} / ${count}`;
    }

    if (DOM.batchNavGroup) {
      DOM.batchNavGroup.style.display = count > 1 ? 'flex' : 'none';
    }

    if (DOM.btnPrevImage) {
      DOM.btnPrevImage.disabled = count <= 1;
    }

    if (DOM.btnNextImage) {
      DOM.btnNextImage.disabled = count <= 1;
    }

    // Top Header & Canvas HUD Dynamic Batch Mode Sync
    if (count > 1) {
      if (DOM.openExportModalBtn) DOM.openExportModalBtn.classList.add('btn-batch-active');
      if (DOM.exportBtnMainLabel) DOM.exportBtnMainLabel.textContent = `Batch Export (${count})`;
      if (DOM.batchExportBadge) DOM.batchExportBadge.style.display = 'inline-flex';
      if (DOM.batchHudBar) DOM.batchHudBar.style.display = 'flex';
      if (DOM.batchHudCount) DOM.batchHudCount.textContent = count;
      if (DOM.hudProcessBtnText) DOM.hudProcessBtnText.textContent = `⚡ Process All (${count}) & Download ZIP`;
    } else {
      if (DOM.openExportModalBtn) DOM.openExportModalBtn.classList.remove('btn-batch-active');
      if (DOM.exportBtnMainLabel) DOM.exportBtnMainLabel.textContent = 'Export 4K/8K';
      if (DOM.batchExportBadge) DOM.batchExportBadge.style.display = 'none';
      if (DOM.batchHudBar) DOM.batchHudBar.style.display = 'none';
    }
  }

  function applyCurrentFXToAllBatch() {
    if (State.batchQueue.length === 0) return;
    const currentSettings = cloneCurrentSettings();
    State.batchQueue.forEach(item => {
      item.settings = JSON.parse(JSON.stringify(currentSettings));
    });
    showToast(`Applied active FX parameters to all ${State.batchQueue.length} images!`, 2500);
  }

  function updateItemBatchStatus(index, status) {
    const cardStatus = document.getElementById(`batchCardStatus_${index}`);
    if (cardStatus) {
      cardStatus.className = `batch-card-status ${status}`;
      cardStatus.textContent = status === 'processing' ? '⚡ Active' : status === 'done' ? '✓ Done' : `#${index + 1}`;
    }
    const previewStatus = document.getElementById(`previewStatus_${index}`);
    if (previewStatus) {
      previewStatus.className = `preview-row-status ${status}`;
      previewStatus.textContent = status === 'processing' ? 'Processing...' : status === 'done' ? '✓ Done' : 'Queued';
    }
  }

  function renderBatchModalPreviewList() {
    if (!DOM.batchItemsPreviewList) return;
    DOM.batchItemsPreviewList.innerHTML = '';
    const targetScale = State.upscale.scaleTarget;
    if (DOM.batchModalListCount) DOM.batchModalListCount.textContent = State.batchQueue.length;

    State.batchQueue.forEach((item, idx) => {
      let targetDim;
      if (targetScale === 'native') {
        targetDim = { width: item.width, height: item.height };
      } else {
        targetDim = calculateTargetDimensions(item.width, item.height, targetScale);
      }

      const row = document.createElement('div');
      row.className = 'batch-item-preview-row';
      row.innerHTML = `
        <div class="preview-row-left">
          <img src="${item.src}" class="preview-row-thumb" alt="${item.name}">
          <div class="preview-row-info">
            <span class="preview-row-name">${item.name}</span>
            <span class="preview-row-dims">${item.width}×${item.height} ➔ ${targetDim.width}×${targetDim.height}</span>
          </div>
        </div>
        <span class="preview-row-status" id="previewStatus_${idx}">Queued</span>
      `;
      DOM.batchItemsPreviewList.appendChild(row);
    });
  }

  // ==========================================================================
  // BATCH PROCESS & EXPORT (ZIP ARCHIVE VIA JSZIP)
  // ==========================================================================
  function openBatchExportModal() {
    if (State.batchQueue.length === 0) {
      showToast('No images in batch queue to export.', 2000);
      return;
    }
    saveActiveItemSettings();
    if (DOM.batchModalTotalCount) {
      DOM.batchModalTotalCount.textContent = State.batchQueue.length;
    }
    if (DOM.batchModalTargetScale) {
      const scale = State.upscale.scaleTarget.toUpperCase();
      DOM.batchModalTargetScale.textContent = scale === 'NATIVE' ? '1X Native' : scale.includes('K') ? `${scale} UHD` : `${scale}X UHD`;
    }
    if (DOM.batchScaleSelectorGrid) {
      DOM.batchScaleSelectorGrid.querySelectorAll('.scale-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-batch-scale') === State.upscale.scaleTarget);
      });
    }
    renderBatchModalPreviewList();
    if (DOM.batchProgressBox) {
      DOM.batchProgressBox.style.display = 'none';
    }
    if (DOM.batchProgressBarFill) {
      DOM.batchProgressBarFill.style.width = '0%';
    }
    if (DOM.batchProgressPercent) {
      DOM.batchProgressPercent.textContent = '0%';
    }
    if (DOM.startBatchExportBtn) {
      DOM.startBatchExportBtn.disabled = false;
    }
    if (DOM.cancelBatchExportBtn) {
      DOM.cancelBatchExportBtn.disabled = false;
    }
    if (DOM.batchDownloadBtnText) {
      DOM.batchDownloadBtnText.textContent = 'Process & Download ZIP';
    }
    if (DOM.batchExportModal) {
      DOM.batchExportModal.style.display = 'flex';
    }
  }

  function closeBatchExportModal() {
    if (DOM.batchExportModal) {
      DOM.batchExportModal.style.display = 'none';
    }
  }

  async function executeBatchExport() {
    let ZipClass = window.JSZip || (typeof JSZip !== 'undefined' ? JSZip : null);
    if (!ZipClass) {
      try {
        await new Promise((resolve, reject) => {
          const s = document.createElement('script');
          s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
          s.onload = () => resolve();
          s.onerror = () => reject(new Error('Failed to load JSZip fallback'));
          document.head.appendChild(s);
        });
        ZipClass = window.JSZip;
      } catch (e) {
        alert('Could not initialize ZIP engine. Please check assets/jszip.min.js.');
        return;
      }
    }

    const total = State.batchQueue.length;
    if (total === 0) return;

    const format = DOM.batchExportFormatSelect ? DOM.batchExportFormatSelect.value : 'png';
    const zipBaseName = (DOM.batchZipNameInput && DOM.batchZipNameInput.value.trim()) || 'lumina-studio-batch-export';
    const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
    const fileExt = format === 'jpeg' ? 'jpg' : format;
    const syncFX = DOM.batchSyncStudioFX ? DOM.batchSyncStudioFX.checked : true;
    const currentStudioSettings = cloneCurrentSettings();

    DOM.batchProgressBox.style.display = 'block';
    DOM.startBatchExportBtn.disabled = true;
    DOM.cancelBatchExportBtn.disabled = true;
    if (DOM.btnHudProcessBatch) DOM.btnHudProcessBatch.disabled = true;
    DOM.batchDownloadBtnText.textContent = 'Processing Batch...';

    const zip = new ZipClass();
    const startTime = performance.now();

    try {
      for (let i = 0; i < total; i++) {
        const item = State.batchQueue[i];
        const settings = syncFX ? JSON.parse(JSON.stringify(currentStudioSettings)) : (item.settings || cloneCurrentSettings());

        updateItemBatchStatus(i, 'processing');

        const pct = Math.round((i / total) * 85);
        DOM.batchProgressCurrentItem.textContent = `[${i + 1}/${total}] Processing "${item.name}"...`;
        DOM.batchProgressPercent.textContent = `${pct}%`;
        DOM.batchProgressBarFill.style.width = `${pct}%`;

        const elapsedSec = (performance.now() - startTime) / 1000;
        if (i > 0 && elapsedSec > 0) {
          const speed = (i / elapsedSec).toFixed(1);
          const eta = Math.ceil((total - i) / (i / elapsedSec));
          DOM.batchProgressSpeed.textContent = `Speed: ${speed} img/s`;
          DOM.batchProgressEta.textContent = `ETA: ~${eta}s`;
        } else {
          DOM.batchProgressSpeed.textContent = `Speed: calculating...`;
          DOM.batchProgressEta.textContent = `ETA: in progress`;
        }

        let targetDim;
        if (settings.upscale.scaleTarget === 'native') {
          targetDim = { width: item.width, height: item.height };
        } else {
          targetDim = calculateTargetDimensions(item.width, item.height, settings.upscale.scaleTarget);
        }

        const offCanvas = document.createElement('canvas');
        offCanvas.width = targetDim.width;
        offCanvas.height = targetDim.height;
        const ctx = offCanvas.getContext('2d', { willReadFrequently: true });
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(item.image, 0, 0, targetDim.width, targetDim.height);

        let imgData = ctx.getImageData(0, 0, targetDim.width, targetDim.height);

        if (settings.features.upscale) {
          applyUpscaleDetailEnhancement(imgData, targetDim.width, targetDim.height, settings.upscale);
        }

        if (settings.features.blur && settings.blur.radius > 0) {
          const scaledBlur = Object.assign({}, settings.blur, {
            radius: Math.round(settings.blur.radius * (targetDim.width / item.width))
          });
          applyBlurFilter(imgData, targetDim.width, targetDim.height, scaledBlur);
        }

        if (settings.features.gradient) {
          applyGradientMap(imgData, targetDim.width, targetDim.height, settings.gradient);
        }

        if (settings.features.noise && settings.noise.amount > 0) {
          applyFilmGrain(imgData, targetDim.width, targetDim.height, settings.noise);
        }

        ctx.putImageData(imgData, 0, 0);

        const blob = await new Promise(resolve => offCanvas.toBlob(resolve, mimeType, 0.95));
        if (blob) {
          const cleanBase = item.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_-]/g, '_');
          const paddedIdx = String(i + 1).padStart(3, '0');
          const outFilename = `${paddedIdx}_${cleanBase}_${targetDim.width}x${targetDim.height}.${fileExt}`;
          zip.file(outFilename, blob);
        }

        updateItemBatchStatus(i, 'done');

        offCanvas.width = 1;
        offCanvas.height = 1;

        await new Promise(r => setTimeout(r, 20));
      }

      DOM.batchProgressCurrentItem.textContent = `Archiving ${total} images into ZIP...`;
      DOM.batchProgressPercent.textContent = '88%';
      DOM.batchProgressBarFill.style.width = '88%';
      DOM.batchProgressSpeed.textContent = 'Compressing...';
      DOM.batchProgressEta.textContent = 'Almost done';

      const zipBlob = await zip.generateAsync(
        { type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } },
        (meta) => {
          const zipPct = Math.min(99, 88 + Math.round(meta.percent * 0.11));
          DOM.batchProgressPercent.textContent = `${zipPct}%`;
          DOM.batchProgressBarFill.style.width = `${zipPct}%`;
        }
      );

      DOM.batchProgressCurrentItem.textContent = `✓ Done! Downloaded ${zipBaseName}.zip`;
      DOM.batchProgressPercent.textContent = '100%';
      DOM.batchProgressBarFill.style.width = '100%';

      const downloadUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `${zipBaseName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 8000);

      setTimeout(() => {
        DOM.startBatchExportBtn.disabled = false;
        DOM.cancelBatchExportBtn.disabled = false;
        if (DOM.btnHudProcessBatch) DOM.btnHudProcessBatch.disabled = false;
        DOM.batchDownloadBtnText.textContent = 'Process & Download ZIP';
        closeBatchExportModal();
        showToast(`🎉 Batch export complete! All ${total} images downloaded in ${zipBaseName}.zip`, 4000);
      }, 1000);

    } catch (err) {
      console.error('Batch export error:', err);
      alert('Batch export error: ' + err.message);
      DOM.startBatchExportBtn.disabled = false;
      DOM.cancelBatchExportBtn.disabled = false;
      if (DOM.btnHudProcessBatch) DOM.btnHudProcessBatch.disabled = false;
      DOM.batchDownloadBtnText.textContent = 'Process & Download ZIP';
    }
  }

  function handleGlobalKeydown(e) {
    const tag = (e.target && e.target.tagName) ? e.target.tagName.toLowerCase() : '';
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      if (e.key === 'Escape') {
        e.target.blur();
      }
      return;
    }

    if (e.key === 'Escape') {
      if (DOM.exportModal && DOM.exportModal.style.display !== 'none') {
        closeExportModal();
      }
      if (DOM.batchExportModal && DOM.batchExportModal.style.display !== 'none') {
        closeBatchExportModal();
      }
      return;
    }

    if (e.key === 'ArrowLeft') {
      if (State.batchQueue.length > 1) {
        e.preventDefault();
        navigateBatchImage(-1);
      }
    } else if (e.key === 'ArrowRight') {
      if (State.batchQueue.length > 1) {
        e.preventDefault();
        navigateBatchImage(1);
      }
    }
  }

  // ==========================================================================
  // SAMPLE IMAGES & FILE LOADING
  // ==========================================================================
  function loadDefaultSample(sampleName) {
    [DOM.sampleCyberpunkBtn, DOM.samplePortraitBtn, DOM.sampleNatureBtn].forEach(btn => {
      if (btn) btn.classList.remove('active');
    });

    if (sampleName === 'cyberpunk' && DOM.sampleCyberpunkBtn) DOM.sampleCyberpunkBtn.classList.add('active');
    if (sampleName === 'portrait' && DOM.samplePortraitBtn) DOM.samplePortraitBtn.classList.add('active');
    if (sampleName === 'nature' && DOM.sampleNatureBtn) DOM.sampleNatureBtn.classList.add('active');

    const imagePath = `assets/${sampleName}.jpg`;
    loadImage(imagePath, `${sampleName}.jpg`, true);
  }

  function handleFileInput(e) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    addFilesToBatch(files, true);
    e.target.value = '';
  }

  function loadImage(src, name = 'sample.jpg', isSample = false) {
    showToast('Loading image into studio...');
    const img = new Image();
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      State.sourceImage = img;
      State.sourceWidth = img.naturalWidth || img.width;
      State.sourceHeight = img.naturalHeight || img.height;
      State.aspectRatio = State.sourceWidth / State.sourceHeight;

      if (State.batchQueue.length === 0 || (State.batchQueue.length === 1 && State.batchQueue[0].isSample)) {
        State.batchQueue = [{
          id: 'item_' + Date.now(),
          name: name,
          image: img,
          src: src,
          width: State.sourceWidth,
          height: State.sourceHeight,
          aspectRatio: State.aspectRatio,
          isSample: isSample,
          settings: cloneCurrentSettings()
        }];
        State.batchActiveIndex = 0;
      }

      updateResolutionBadges();
      updateBatchUI();
      renderFilmstrip();
      fitCanvasToViewport();
      requestRender();
      hideToast();
    };
    img.onerror = () => {
      console.warn('Could not load image directly from:', src);
      generateProceduralFallbackSample(name || src);
    };
    img.src = src;
  }

  function generateProceduralFallbackSample(sampleName) {
    const canvas = document.createElement('canvas');
    canvas.width = 1280;
    canvas.height = 720;
    const ctx = canvas.getContext('2d');

    if (String(sampleName).includes('portrait')) {
      const grad = ctx.createRadialGradient(640, 360, 50, 640, 360, 600);
      grad.addColorStop(0, '#d49b8d');
      grad.addColorStop(0.5, '#4a2522');
      grad.addColorStop(1, '#1b0b0a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = 'rgba(255, 230, 220, 0.3)';
      ctx.beginPath();
      ctx.arc(640, 300, 160, 0, Math.PI * 2);
      ctx.fill();
    } else if (String(sampleName).includes('nature')) {
      const grad = ctx.createLinearGradient(0, 0, 0, 720);
      grad.addColorStop(0, '#102a43');
      grad.addColorStop(0.5, '#334e68');
      grad.addColorStop(0.8, '#829ab1');
      grad.addColorStop(1, '#243b53');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);
      ctx.fillStyle = '#0b1b2b';
      ctx.beginPath();
      ctx.moveTo(0, 720);
      ctx.lineTo(350, 320);
      ctx.lineTo(600, 500);
      ctx.lineTo(950, 240);
      ctx.lineTo(1280, 720);
      ctx.closePath();
      ctx.fill();
    } else {
      const grad = ctx.createLinearGradient(0, 0, 1280, 720);
      grad.addColorStop(0, '#06001a');
      grad.addColorStop(0.4, '#1a0044');
      grad.addColorStop(0.7, '#670067');
      grad.addColorStop(1, '#001a33');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 1280, 720);

      ctx.strokeStyle = 'rgba(0, 242, 254, 0.4)';
      ctx.lineWidth = 2;
      for (let x = 0; x <= 1280; x += 80) {
        ctx.beginPath();
        ctx.moveTo(x, 400);
        ctx.lineTo((x - 640) * 2.5 + 640, 720);
        ctx.stroke();
      }
      const orbGrad = ctx.createRadialGradient(640, 340, 10, 640, 340, 150);
      orbGrad.addColorStop(0, '#ff007f');
      orbGrad.addColorStop(0.6, '#7928ca');
      orbGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = orbGrad;
      ctx.beginPath();
      ctx.arc(640, 340, 150, 0, Math.PI * 2);
      ctx.fill();
    }

    const fallbackImg = new Image();
    fallbackImg.onload = () => {
      State.sourceImage = fallbackImg;
      State.sourceWidth = 1280;
      State.sourceHeight = 720;
      State.aspectRatio = 1280 / 720;

      if (State.batchQueue.length === 0 || (State.batchQueue.length === 1 && State.batchQueue[0].isSample)) {
        State.batchQueue = [{
          id: 'sample_fallback',
          name: `${sampleName || 'sample'}.jpg`,
          image: fallbackImg,
          src: fallbackImg.src,
          width: 1280,
          height: 720,
          aspectRatio: 1280 / 720,
          isSample: true,
          settings: cloneCurrentSettings()
        }];
        State.batchActiveIndex = 0;
      }

      updateResolutionBadges();
      updateBatchUI();
      renderFilmstrip();
      fitCanvasToViewport();
      requestRender();
      hideToast();
    };
    fallbackImg.src = canvas.toDataURL('image/jpeg', 0.92);
  }

  function updateResolutionBadges() {
    const origW = State.sourceWidth;
    const origH = State.sourceHeight;
    const origMP = ((origW * origH) / 1000000).toFixed(1);
    DOM.origResLabel.textContent = `${origW} × ${origH} (${origMP} MP)`;

    // Calculate Target Resolution
    const target = calculateTargetDimensions(origW, origH, State.upscale.scaleTarget);
    const targetMP = ((target.width * target.height) / 1000000).toFixed(1);
    const targetTag = State.upscale.scaleTarget === '4k' ? ' - 4K UHD' : State.upscale.scaleTarget === '8k' ? ' - 8K UHD' : ` - ${State.upscale.scaleTarget}X`;
    DOM.targetResLabel.textContent = `${target.width} × ${target.height} (${targetMP} MP${targetTag})`;

    // Modal texts
    DOM.exportNativeResText.textContent = `${origW} × ${origH}`;
    const res4k = calculateTargetDimensions(origW, origH, '4k');
    DOM.export4kResText.textContent = `${res4k.width} × ${res4k.height}`;
    const res8k = calculateTargetDimensions(origW, origH, '8k');
    DOM.export8kResText.textContent = `${res8k.width} × ${res8k.height}`;
  }

  function calculateTargetDimensions(w, h, scaleType) {
    if (scaleType === '2') {
      return { width: Math.round(w * 2), height: Math.round(h * 2) };
    }
    if (scaleType === '4') {
      return { width: Math.round(w * 4), height: Math.round(h * 4) };
    }
    if (scaleType === '4k') {
      // 3840 target (preserving aspect ratio)
      const aspect = w / h;
      if (aspect >= 1) {
        return { width: 3840, height: Math.round(3840 / aspect) };
      } else {
        return { width: Math.round(2160 * aspect), height: 2160 };
      }
    }
    if (scaleType === '8k') {
      // 7680 target (preserving aspect ratio)
      const aspect = w / h;
      if (aspect >= 1) {
        return { width: 7680, height: Math.round(7680 / aspect) };
      } else {
        return { width: Math.round(4320 * aspect), height: 4320 };
      }
    }
    if (scaleType === 'custom') {
      const mult = (State.upscale && State.upscale.customMultiplier) ? State.upscale.customMultiplier : 3;
      return { width: Math.round(w * mult), height: Math.round(h * mult) };
    }
    return { width: w, height: h };
  }

  // ==========================================================================
  // VIEW MODES & TABS
  // ==========================================================================
  function setViewMode(mode) {
    State.viewMode = mode;
    [DOM.viewSplitBtn, DOM.viewSideBtn, DOM.viewProcessedBtn].forEach(b => b.classList.remove('active'));

    if (mode === 'split') {
      DOM.viewSplitBtn.classList.add('active');
      DOM.splitComparisonContainer.style.display = 'block';
      DOM.sideBySideContainer.style.display = 'none';
      DOM.originalClipWrapper.style.display = 'block';
      DOM.splitDividerLine.style.display = 'flex';
      updateSplitDivider();
    } else if (mode === 'side') {
      DOM.viewSideBtn.classList.add('active');
      DOM.splitComparisonContainer.style.display = 'none';
      DOM.sideBySideContainer.style.display = 'flex';
      renderSideBySide();
    } else if (mode === 'processed') {
      DOM.viewProcessedBtn.classList.add('active');
      DOM.splitComparisonContainer.style.display = 'block';
      DOM.sideBySideContainer.style.display = 'none';
      DOM.originalClipWrapper.style.display = 'none';
      DOM.splitDividerLine.style.display = 'none';
    }
  }

  function switchTab(tabId) {
    DOM.tabButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    DOM.tabPanes.forEach(pane => {
      pane.classList.toggle('active', pane.id === `pane${capitalize(tabId)}`);
    });
  }

  function updatePipelineTags() {
    DOM.pipeUpscalePill.classList.toggle('active', State.features.upscale);
    DOM.pipeUpscalePill.textContent = State.features.upscale ? `🚀 Upscale ${State.upscale.scaleTarget.toUpperCase()}${State.upscale.scaleTarget === '4k' || State.upscale.scaleTarget === '8k' ? '' : 'X'}` : '🚀 Upscale';

    DOM.pipeGradientPill.classList.toggle('active', State.features.gradient);
    DOM.pipeNoisePill.classList.toggle('active', State.features.noise);
    DOM.pipeBlurPill.classList.toggle('active', State.features.blur);
  }

  function updateBlurSubcontrols() {
    if (DOM.motionAngleGroup) DOM.motionAngleGroup.style.display = State.blur.mode === 'motion' ? 'block' : 'none';
    if (DOM.radialSpinGroup) DOM.radialSpinGroup.style.display = (State.blur.mode === 'radial' || State.blur.mode === 'zoom') ? 'block' : 'none';
    if (DOM.tiltShiftGroup) DOM.tiltShiftGroup.style.display = State.blur.mode === 'tiltshift' ? 'block' : 'none';
    if (DOM.bokehGroup) DOM.bokehGroup.style.display = State.blur.mode === 'bokeh' ? 'block' : 'none';
    if (DOM.maskGroup) DOM.maskGroup.style.display = State.blur.mode === 'background' ? 'block' : 'none';
  }

  function activateCustomGradient() {
    DOM.gradientCards.forEach(c => c.classList.remove('active'));
    if (!State.features.gradient) {
      State.features.gradient = true;
      DOM.toggleGradient.checked = true;
      DOM.gradientTag.textContent = 'Active';
      updatePipelineTags();
    }
    requestRender();
  }

  // ==========================================================================
  // SPLIT-SCREEN COMPARISON SLIDER
  // ==========================================================================
  function setupSplitDividerDrag() {
    let isDraggingSplit = false;

    const onDividerDown = (e) => {
      isDraggingSplit = true;
      e.preventDefault();
      document.body.style.cursor = 'ew-resize';
    };

    const onDividerMove = (e) => {
      if (!isDraggingSplit) return;
      const rect = DOM.splitComparisonContainer.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const offsetX = clientX - rect.left;
      let ratio = offsetX / rect.width;
      ratio = Math.max(0.01, Math.min(0.99, ratio));
      State.splitRatio = ratio;
      updateSplitDivider();
    };

    const onDividerUp = () => {
      if (isDraggingSplit) {
        isDraggingSplit = false;
        document.body.style.cursor = '';
      }
    };

    DOM.splitDividerLine.addEventListener('mousedown', onDividerDown);
    DOM.splitDividerLine.addEventListener('touchstart', onDividerDown, { passive: false });

    window.addEventListener('mousemove', onDividerMove);
    window.addEventListener('touchmove', onDividerMove, { passive: false });

    window.addEventListener('mouseup', onDividerUp);
    window.addEventListener('touchend', onDividerUp);
  }

  function updateSplitDivider() {
    const percent = (State.splitRatio * 100).toFixed(2);
    DOM.splitDividerLine.style.left = `${percent}%`;
    DOM.originalClipWrapper.style.width = `${percent}%`;
  }

  // ==========================================================================
  // PAN & ZOOM CONTROLS
  // ==========================================================================
  function setupPanAndZoom() {
    DOM.zoomInBtn.addEventListener('click', () => setZoom(State.zoom * 1.25, true));
    DOM.zoomOutBtn.addEventListener('click', () => setZoom(State.zoom / 1.25, true));
    DOM.zoomActualBtn.addEventListener('click', () => {
      State.panX = 0;
      State.panY = 0;
      setZoom(1.0, true);
    });
    DOM.zoomFitBtn.addEventListener('click', fitCanvasToViewport);

    // Mouse wheel zoom
    DOM.canvasScrollArea.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.15 : 0.87;
      setZoom(State.zoom * zoomFactor, false);
    }, { passive: false });

    // Drag to pan (Mouse)
    DOM.canvasScrollArea.addEventListener('mousedown', (e) => {
      if (e.target.closest('#splitDividerLine')) return;
      State.isPanning = true;
      State.panStartX = e.clientX - State.panX;
      State.panStartY = e.clientY - State.panY;
      DOM.canvasScrollArea.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!State.isPanning) return;
      State.panX = e.clientX - State.panStartX;
      State.panY = e.clientY - State.panStartY;
      applyViewportTransform();
    });

    window.addEventListener('mouseup', () => {
      if (State.isPanning) {
        State.isPanning = false;
        DOM.canvasScrollArea.style.cursor = 'grab';
      }
    });

    // Touch Support (1-finger pan, 2-finger pinch zoom)
    DOM.canvasScrollArea.addEventListener('touchstart', (e) => {
      if (e.target.closest('#splitDividerLine')) return;
      if (e.touches.length === 1) {
        State.isPanning = true;
        State.panStartX = e.touches[0].clientX - State.panX;
        State.panStartY = e.touches[0].clientY - State.panY;
      } else if (e.touches.length === 2) {
        State.isPanning = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        State.initialPinchDist = Math.hypot(dx, dy);
        State.initialPinchZoom = State.zoom;
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (State.isPanning && e.touches.length === 1) {
        State.panX = e.touches[0].clientX - State.panStartX;
        State.panY = e.touches[0].clientY - State.panStartY;
        applyViewportTransform();
      } else if (e.touches.length === 2 && State.initialPinchDist) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        setZoom(State.initialPinchZoom * (dist / State.initialPinchDist), false);
      }
    }, { passive: true });

    window.addEventListener('touchend', () => {
      State.isPanning = false;
      State.initialPinchDist = null;
    });
  }

  function setZoom(val, animate = false) {
    State.zoom = Math.max(0.2, Math.min(5.0, val));
    DOM.zoomLevelDisplay.textContent = `${Math.round(State.zoom * 100)}%`;
    if (animate && DOM.canvasViewport) {
      DOM.canvasViewport.classList.add('animated-transform');
      applyViewportTransform();
      setTimeout(() => DOM.canvasViewport.classList.remove('animated-transform'), 250);
    } else {
      applyViewportTransform();
    }
  }

  function fitCanvasToViewport() {
    if (!State.sourceWidth || !State.sourceHeight) return;

    const areaW = DOM.canvasScrollArea.clientWidth - 60;
    const areaH = DOM.canvasScrollArea.clientHeight - 80;

    const scaleW = areaW / State.sourceWidth;
    const scaleH = areaH / State.sourceHeight;
    const fitScale = Math.min(scaleW, scaleH, 1.0);

    State.panX = 0;
    State.panY = 0;
    setZoom(Math.max(0.2, fitScale), true);
  }

  function applyViewportTransform() {
    DOM.canvasViewport.style.transform = `translate(${State.panX}px, ${State.panY}px) scale(${State.zoom})`;
  }

  // ==========================================================================
  // DRAG & DROP
  // ==========================================================================
  function setupDragAndDrop() {
    ['dragenter', 'dragover'].forEach(name => {
      DOM.viewportStage.addEventListener(name, (e) => {
        e.preventDefault();
        DOM.dropZoneOverlay.classList.add('active');
      });
    });

    ['dragleave', 'drop'].forEach(name => {
      DOM.viewportStage.addEventListener(name, (e) => {
        e.preventDefault();
        DOM.dropZoneOverlay.classList.remove('active');
      });
    });

    DOM.viewportStage.addEventListener('drop', (e) => {
      e.preventDefault();
      DOM.dropZoneOverlay.classList.remove('active');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFilesToBatch(e.dataTransfer.files, State.batchQueue.length <= 1);
      }
    });
  }

  // ==========================================================================
  // HIGH-PERFORMANCE WORK BUFFERS & LOOKUP TABLES
  // ==========================================================================
  let workBuffer = null;
  let workBufferLen = 0;

  function getWorkBuffer(length) {
    if (!workBuffer || workBufferLen !== length) {
      workBuffer = new Uint8ClampedArray(length);
      workBufferLen = length;
    }
    return workBuffer;
  }

  // Precomputed Clarity LUT (256 entries)
  const clarityLUT = new Float32Array(256);
  let lastClarityVal = -999;

  function updateClarityLUT(clarity) {
    if (lastClarityVal === clarity) return;
    lastClarityVal = clarity;
    const factor = (clarity / 100) * 26;
    for (let i = 0; i < 256; i++) {
      const norm = (i - 128) / 128;
      clarityLUT[i] = Math.sin(norm * Math.PI) * factor;
    }
  }

  // Pre-generated Seeded Random Table (4096 entries)
  const NOISE_RANDOM_TABLE = new Float32Array(4096);
  for (let i = 0; i < 4096; i++) {
    NOISE_RANDOM_TABLE[i] = (Math.random() - 0.5) * 2;
  }

  // Precomputed Kodak Midtone Curve LUT (256 entries)
  const MIDTONE_WEIGHT_LUT = new Float32Array(256);
  for (let l = 0; l < 256; l++) {
    const diff = (l / 255) - 0.5;
    MIDTONE_WEIGHT_LUT[l] = Math.max(0.18, 1.0 - 4.0 * (diff * diff));
  }

  // ==========================================================================
  // CORE IMAGE PROCESSING ENGINE (PIPELINE)
  // ==========================================================================
  function requestRender() {
    if (State.needsRender) return;
    State.needsRender = true;
    requestAnimationFrame(renderPipeline);
  }

  function renderPipeline() {
    State.needsRender = false;
    if (!State.sourceImage) return;

    State.renderStartTime = performance.now();

    const w = State.sourceWidth;
    const h = State.sourceHeight;

    // 1. Prepare Original Canvas (only resize/redraw when dimensions change!)
    if (DOM.originalCanvas.width !== w || DOM.originalCanvas.height !== h) {
      DOM.originalCanvas.width = w;
      DOM.originalCanvas.height = h;
      const origCtx = DOM.originalCanvas.getContext('2d', { willReadFrequently: true });
      origCtx.drawImage(State.sourceImage, 0, 0, w, h);
    }

    // 2. Prepare Processed Canvas
    if (DOM.processedCanvas.width !== w || DOM.processedCanvas.height !== h) {
      DOM.processedCanvas.width = w;
      DOM.processedCanvas.height = h;
    }

    const procCtx = DOM.processedCanvas.getContext('2d', { willReadFrequently: true });
    procCtx.drawImage(State.sourceImage, 0, 0, w, h);

    let imgData = procCtx.getImageData(0, 0, w, h);

    // STEP 1: UPSCALE & DETAIL ENHANCEMENT ENGINE
    if (State.features.upscale) {
      applyUpscaleDetailEnhancement(imgData, w, h, State.upscale);
    }

    // STEP 2: BLUR FX (if enabled)
    if (State.features.blur && State.blur.radius > 0) {
      applyBlurFilter(imgData, w, h, State.blur);
    }

    // STEP 3: GRADIENT MAP FX (if enabled)
    if (State.features.gradient) {
      applyGradientMap(imgData, w, h, State.gradient);
    }

    // STEP 4: NOISE & FILM GRAIN (if enabled)
    if (State.features.noise && State.noise.amount > 0) {
      applyFilmGrain(imgData, w, h, State.noise);
    }

    // Write processed pixels back
    procCtx.putImageData(imgData, 0, 0);

    // Update Split Divider & side by side if active
    updateSplitDivider();
    if (State.viewMode === 'side') {
      renderSideBySide();
    }

    const elapsed = Math.round(performance.now() - State.renderStartTime);
    if (DOM.renderSpeedLabel) {
      DOM.renderSpeedLabel.textContent = `⚡ Rendered in ${elapsed}ms`;
    }
  }

  function renderSideBySide() {
    if (DOM.sideOriginalCanvas.width !== State.sourceWidth || DOM.sideOriginalCanvas.height !== State.sourceHeight) {
      DOM.sideOriginalCanvas.width = State.sourceWidth;
      DOM.sideOriginalCanvas.height = State.sourceHeight;
    }
    const oCtx = DOM.sideOriginalCanvas.getContext('2d');
    oCtx.drawImage(DOM.originalCanvas, 0, 0);

    if (DOM.sideProcessedCanvas.width !== State.sourceWidth || DOM.sideProcessedCanvas.height !== State.sourceHeight) {
      DOM.sideProcessedCanvas.width = State.sourceWidth;
      DOM.sideProcessedCanvas.height = State.sourceHeight;
    }
    const pCtx = DOM.sideProcessedCanvas.getContext('2d');
    pCtx.drawImage(DOM.processedCanvas, 0, 0);
  }

  // ==========================================================================
  // ALGORITHM 1: AI UPSCALE & DETAIL ENHANCEMENT
  // ==========================================================================
  function applyUpscaleDetailEnhancement(imgData, width, height, settings) {
    const data = imgData.data;
    const sharpness = (settings.sharpness !== undefined ? settings.sharpness : 65) / 100;
    const clarity = (settings.clarity !== undefined ? settings.clarity : 45) / 100;
    const denoise = (settings.denoise !== undefined ? settings.denoise : 20) / 100;
    const vibrance = (settings.vibrance !== undefined ? settings.vibrance : 0) / 100;
    const engine = settings.engine || 'neural';
    const faceEnhance = settings.faceEnhancement && (settings.faceIntensity || 0) > 0;
    const faceInt = (settings.faceIntensity || 0) / 100;

    if (sharpness === 0 && clarity === 0 && denoise === 0 && vibrance === 0 && !faceEnhance && engine === 'mitchell') {
      return;
    }

    updateClarityLUT(settings.clarity !== undefined ? settings.clarity : 45);

    const buffer = getWorkBuffer(data.length);
    buffer.set(data);

    let edgeMult = 1.6;
    let laplacianWeight = 0.25;
    if (engine === 'neural') {
      edgeMult = 2.4;
    } else if (engine === 'cinematic') {
      edgeMult = 1.4;
    } else if (engine === 'anime') {
      edgeMult = 2.8;
    } else if (engine === 'bilinear') {
      edgeMult = 0.9;
    } else if (engine === 'nearest') {
      edgeMult = 3.2;
    }

    const sharpWeight = sharpness * edgeMult;

    for (let y = 1; y < height - 1; y++) {
      const rowOffset = y * width;
      const prevRowOffset = (y - 1) * width;
      const nextRowOffset = (y + 1) * width;

      for (let x = 1; x < width - 1; x++) {
        const idx = (rowOffset + x) * 4;

        let isSkin = false;
        if (faceEnhance) {
          const r = buffer[idx];
          const g = buffer[idx + 1];
          const b = buffer[idx + 2];
          if (r > 60 && g > 40 && b > 20 && r > g && r > b && (r - g) > 15) {
            isSkin = true;
          }
        }

        for (let c = 0; c < 3; c++) {
          const centerVal = buffer[idx + c];
          const topVal = buffer[((prevRowOffset + x) * 4) + c];
          const bottomVal = buffer[((nextRowOffset + x) * 4) + c];
          const leftVal = buffer[((rowOffset + x - 1) * 4) + c];
          const rightVal = buffer[((rowOffset + x + 1) * 4) + c];

          const laplacian = (topVal + bottomVal + leftVal + rightVal) * laplacianWeight;
          const diff = centerVal - laplacian;

          let enhanced = centerVal;

          if (sharpness > 0) {
            if (isSkin) {
              enhanced = centerVal + diff * (sharpWeight * (1 - faceInt * 0.7));
            } else {
              enhanced = centerVal + diff * sharpWeight;
            }
          }

          if (clarity > 0) {
            enhanced += clarityLUT[centerVal];
          }

          if (denoise > 0 && Math.abs(diff) < 20) {
            enhanced = enhanced * (1 - denoise * 0.5) + laplacian * (denoise * 0.5);
          }

          if (isSkin && faceEnhance) {
            enhanced = enhanced * (1 - faceInt * 0.45) + laplacian * (faceInt * 0.45);
          }

          data[idx + c] = enhanced < 0 ? 0 : (enhanced > 255 ? 255 : (enhanced | 0));
        }

        if (vibrance !== 0) {
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const sat = (max - min) / (max || 1);
          const amt = (1 - sat) * vibrance;
          const avg = (r + g + b) / 3;
          data[idx] = Math.max(0, Math.min(255, (r + (r - avg) * amt) | 0));
          data[idx + 1] = Math.max(0, Math.min(255, (g + (g - avg) * amt) | 0));
          data[idx + 2] = Math.max(0, Math.min(255, (b + (b - avg) * amt) | 0));
        }
      }
    }
  }

  // ==========================================================================
  // ALGORITHM 2: IMAGE TO GRADIENT / GRADIENT MAP
  // ==========================================================================
  function applyGradientMap(imgData, width, height, settings) {
    const data = imgData.data;
    const stops = settings.stops;
    const opacity = (settings.opacity !== undefined ? settings.opacity : 85) / 100;
    const blendMode = settings.blendMode || 'overlay';
    const contrast = (settings.contrast !== undefined ? settings.contrast : 50) / 100;
    const invert = Boolean(settings.invert);
    const gradType = settings.type || 'linear';
    const angleRad = ((settings.angle !== undefined ? settings.angle : 135) * Math.PI) / 180;
    const focalX = ((settings.focalX !== undefined ? settings.focalX : 50) / 100) * width;
    const focalY = ((settings.focalY !== undefined ? settings.focalY : 50) / 100) * height;
    const maxRadius = Math.max(width, height) * ((settings.radialRadius !== undefined ? settings.radialRadius : 70) / 100);

    const lut = generateGradientLUT(stops, invert, contrast);

    const cosA = Math.cos(angleRad);
    const sinA = Math.sin(angleRad);
    const invWidth = 1 / width;
    const invHeight = 1 / height;
    const invMaxRadius = 1 / (maxRadius || 1);
    const invOp = 1 - opacity;

    for (let y = 0; y < height; y++) {
      const rowOffset = y * width * 4;
      for (let x = 0; x < width; x++) {
        const idx = rowOffset + x * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        let tIdx;
        if (gradType === 'radial') {
          const dx = x - focalX;
          const dy = y - focalY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const t = Math.min(1, dist * invMaxRadius);
          tIdx = (t * 255) | 0;
        } else if (gradType === 'angular') {
          const dx = x - focalX;
          const dy = y - focalY;
          const ang = Math.atan2(dy, dx) + Math.PI;
          tIdx = ((ang / (Math.PI * 2)) * 255) | 0;
        } else if (gradType === 'linear') {
          const nx = (x * invWidth) - 0.5;
          const ny = (y * invHeight) - 0.5;
          const proj = nx * cosA + ny * sinA + 0.5;
          const t = Math.max(0, Math.min(1, proj));
          tIdx = (t * 255) | 0;
        } else {
          tIdx = ((r * 77 + g * 150 + b * 29) >> 8);
        }

        const mapR = lut.r[tIdx];
        const mapG = lut.g[tIdx];
        const mapB = lut.b[tIdx];

        let blR, blG, blB;
        if (blendMode === 'overlay') {
          blR = r < 128 ? (2 * r * mapR) / 255 : 255 - (2 * (255 - r) * (255 - mapR)) / 255;
          blG = g < 128 ? (2 * g * mapG) / 255 : 255 - (2 * (255 - g) * (255 - mapG)) / 255;
          blB = b < 128 ? (2 * b * mapB) / 255 : 255 - (2 * (255 - b) * (255 - mapB)) / 255;
        } else if (blendMode === 'soft-light') {
          const nbR = r / 255, nsR = mapR / 255;
          const nbG = g / 255, nsG = mapG / 255;
          const nbB = b / 255, nsB = mapB / 255;
          blR = ((1 - 2 * nsR) * (nbR * nbR) + 2 * nsR * nbR) * 255;
          blG = ((1 - 2 * nsG) * (nbG * nbG) + 2 * nsG * nbG) * 255;
          blB = ((1 - 2 * nsB) * (nbB * nbB) + 2 * nsB * nbB) * 255;
        } else if (blendMode === 'screen') {
          blR = 255 - ((255 - r) * (255 - mapR)) / 255;
          blG = 255 - ((255 - g) * (255 - mapG)) / 255;
          blB = 255 - ((255 - b) * (255 - mapB)) / 255;
        } else if (blendMode === 'multiply') {
          blR = (r * mapR) / 255;
          blG = (g * mapG) / 255;
          blB = (b * mapB) / 255;
        } else if (blendMode === 'color-dodge') {
          blR = mapR === 255 ? 255 : Math.min(255, (r * 255) / (255 - mapR));
          blG = mapG === 255 ? 255 : Math.min(255, (g * 255) / (255 - mapG));
          blB = mapB === 255 ? 255 : Math.min(255, (b * 255) / (255 - mapB));
        } else {
          blR = mapR;
          blG = mapG;
          blB = mapB;
        }

        data[idx] = (r * invOp + blR * opacity) | 0;
        data[idx + 1] = (g * invOp + blG * opacity) | 0;
        data[idx + 2] = (b * invOp + blB * opacity) | 0;
      }
    }
  }

  function hexToRgb(val) {
    if (!val) return { r: 255, g: 255, b: 255 };
    if (typeof val === 'object') {
      if (typeof val.r === 'number' && typeof val.g === 'number' && typeof val.b === 'number') {
        return val;
      }
      val = val.color || '#ffffff';
    }
    let cleaned = String(val).replace('#', '').trim();
    if (cleaned.length === 3) {
      cleaned = cleaned.split('').map(c => c + c).join('');
    }
    const num = parseInt(cleaned, 16);
    if (isNaN(num)) return { r: 255, g: 255, b: 255 };
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    };
  }

  function generateGradientLUT(stops, invert, contrast) {
    const rawStops = (stops && stops.length ? stops : ['#000000', '#ffffff']).map((s, i) => {
      const rgb = hexToRgb(s);
      const off = typeof s === 'object' && s.offset !== undefined ? s.offset / 100 : i / Math.max(1, stops.length - 1);
      return { r: rgb.r, g: rgb.g, b: rgb.b, offset: Math.max(0, Math.min(1, off)) };
    });

    rawStops.sort((a, b) => a.offset - b.offset);

    const lut = {
      r: new Uint8ClampedArray(256),
      g: new Uint8ClampedArray(256),
      b: new Uint8ClampedArray(256)
    };

    const contrastFactor = (contrast - 0.5) * 2;

    for (let i = 0; i < 256; i++) {
      let t = i / 255;
      if (invert) t = 1.0 - t;

      if (contrast !== 0.5) {
        t = t + contrastFactor * 0.5 * Math.sin(t * Math.PI * 2);
        t = Math.max(0, Math.min(1, t));
      }

      let seg = 0;
      while (seg < rawStops.length - 1 && rawStops[seg + 1].offset < t) {
        seg++;
      }

      const c1 = rawStops[seg];
      const c2 = rawStops[Math.min(seg + 1, rawStops.length - 1)];

      const span = c2.offset - c1.offset;
      const localT = span > 0.0001 ? Math.max(0, Math.min(1, (t - c1.offset) / span)) : 0;

      lut.r[i] = (c1.r * (1 - localT) + c2.r * localT) | 0;
      lut.g[i] = (c1.g * (1 - localT) + c2.g * localT) | 0;
      lut.b[i] = (c1.b * (1 - localT) + c2.b * localT) | 0;
    }

    return lut;
  }

  // ==========================================================================
  // ALGORITHM 3: NOISE ADD (FILM GRAIN & TEXTURE)
  // ==========================================================================
  function applyFilmGrain(imgData, width, height, settings) {
    const data = imgData.data;
    const amount = ((settings.amount !== undefined ? settings.amount : 35) / 100) * 128;
    const size = Math.max(1, Math.round(settings.size || 1.5));
    const isMono = settings.monochrome !== undefined ? settings.monochrome : true;
    const stockType = settings.type || 'film35';
    const blendMode = settings.blendMode || 'overlay';
    const dustScratches = (settings.dustAndScratches || 0) / 100;

    let randIdx = (settings.seed || 12345) & 4095;

    let shadowBias = 1.0;
    let colorSatMult = 1.0;
    if (stockType === 'ilford') {
      shadowBias = 1.6;
    } else if (stockType === 'polaroid') {
      colorSatMult = 1.4;
    } else if (stockType === 'chromatic') {
      colorSatMult = 2.0;
    }

    for (let y = 0; y < height; y += size) {
      for (let x = 0; x < width; x += size) {
        const rSample = NOISE_RANDOM_TABLE[(randIdx++) & 4095];
        let noiseR = rSample * amount;
        let noiseG = isMono && stockType !== 'chromatic' ? noiseR : NOISE_RANDOM_TABLE[(randIdx++) & 4095] * amount * colorSatMult;
        let noiseB = isMono && stockType !== 'chromatic' ? noiseR : NOISE_RANDOM_TABLE[(randIdx++) & 4095] * amount * colorSatMult;

        if (dustScratches > 0 && Math.random() < dustScratches * 0.0008) {
          noiseR = 180;
          noiseG = 180;
          noiseB = 180;
        }

        for (let dy = 0; dy < size && y + dy < height; dy++) {
          const rowStart = (y + dy) * width;
          for (let dx = 0; dx < size && x + dx < width; dx++) {
            const idx = (rowStart + x + dx) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const lum = (r * 77 + g * 150 + b * 29) >> 8;

            let weight = MIDTONE_WEIGHT_LUT[lum];
            if (stockType === 'ilford' && lum < 80) {
              weight *= shadowBias;
            }

            if (blendMode === 'screen') {
              data[idx] = Math.min(255, r + Math.max(0, noiseR * weight));
              data[idx + 1] = Math.min(255, g + Math.max(0, noiseG * weight));
              data[idx + 2] = Math.min(255, b + Math.max(0, noiseB * weight));
            } else {
              data[idx] = Math.max(0, Math.min(255, (r + noiseR * weight) | 0));
              data[idx + 1] = Math.max(0, Math.min(255, (g + noiseG * weight) | 0));
              data[idx + 2] = Math.max(0, Math.min(255, (b + noiseB * weight) | 0));
            }
          }
        }
      }
    }
  }

  function handleNoiseAnimation() {
    if (State.features.noise && State.noise.animated) {
      if (!State.animationFrameId) {
        const loop = () => {
          if (State.features.noise && State.noise.animated) {
            renderPipeline();
            State.animationFrameId = requestAnimationFrame(loop);
          } else {
            State.animationFrameId = null;
          }
        };
        State.animationFrameId = requestAnimationFrame(loop);
      }
    } else {
      if (State.animationFrameId) {
        cancelAnimationFrame(State.animationFrameId);
        State.animationFrameId = null;
      }
    }
  }

  // ==========================================================================
  // ALGORITHM 4: IMAGE TO BLUR (CINEMATIC BLUR STUDIO)
  // ==========================================================================
  function applyBlurFilter(imgData, width, height, settings) {
    const radius = Math.min(50, settings.radius || 15);
    if (radius <= 0) return;

    const mode = settings.mode || 'gaussian';

    if (mode === 'gaussian') {
      fastBoxBlur(imgData, width, height, radius);
    } else if (mode === 'motion') {
      fastMotionBlur(imgData, width, height, radius, settings.angle || 45);
    } else if (mode === 'tiltshift') {
      applyTiltShiftBlur(imgData, width, height, radius, settings.tiltFocusPos || 50, settings.tiltFocusWidth || 30);
    } else if (mode === 'radial') {
      applyRadialBlur(imgData, width, height, radius, false);
    } else if (mode === 'zoom') {
      applyRadialBlur(imgData, width, height, radius, true);
    } else if (mode === 'bokeh') {
      applyBokehBloom(imgData, width, height, radius, settings.bokehThreshold || 75);
    } else if (mode === 'background') {
      applyBackgroundSubjectBlur(imgData, width, height, radius, settings);
    }
  }

  function fastBoxBlur(imgData, width, height, radius) {
    const data = imgData.data;
    const len = data.length;
    const buffer = getWorkBuffer(len);

    boxBlurHorizontal(data, buffer, width, height, radius);
    boxBlurVertical(buffer, data, width, height, radius);
  }

  function boxBlurHorizontal(src, dst, width, height, r) {
    const iarr = 1 / (r + r + 1);
    for (let y = 0; y < height; y++) {
      let ti = y * width * 4;
      let li = ti;
      let ri = ti + r * 4;

      let fvR = src[ti], fvG = src[ti + 1], fvB = src[ti + 2];
      let lvR = src[ti + (width - 1) * 4], lvG = src[ti + (width - 1) * 4 + 1], lvB = src[ti + (width - 1) * 4 + 2];

      let valR = (r + 1) * fvR;
      let valG = (r + 1) * fvG;
      let valB = (r + 1) * fvB;

      for (let j = 0; j < r; j++) {
        valR += src[ti + j * 4];
        valG += src[ti + j * 4 + 1];
        valB += src[ti + j * 4 + 2];
      }

      for (let j = 0; j <= r; j++) {
        valR += src[ri] - fvR;
        valG += src[ri + 1] - fvG;
        valB += src[ri + 2] - fvB;
        dst[ti] = valR * iarr;
        dst[ti + 1] = valG * iarr;
        dst[ti + 2] = valB * iarr;
        dst[ti + 3] = src[ti + 3];
        ri += 4; ti += 4;
      }

      for (let j = r + 1; j < width - r; j++) {
        valR += src[ri] - src[li];
        valG += src[ri + 1] - src[li + 1];
        valB += src[ri + 2] - src[li + 2];
        dst[ti] = valR * iarr;
        dst[ti + 1] = valG * iarr;
        dst[ti + 2] = valB * iarr;
        dst[ti + 3] = src[ti + 3];
        li += 4; ri += 4; ti += 4;
      }

      for (let j = width - r; j < width; j++) {
        valR += lvR - src[li];
        valG += lvG - src[li + 1];
        valB += lvB - src[li + 2];
        dst[ti] = valR * iarr;
        dst[ti + 1] = valG * iarr;
        dst[ti + 2] = valB * iarr;
        dst[ti + 3] = src[ti + 3];
        li += 4; ti += 4;
      }
    }
  }

  function boxBlurVertical(src, dst, width, height, r) {
    const iarr = 1 / (r + r + 1);
    for (let x = 0; x < width; x++) {
      let ti = x * 4;
      let li = ti;
      let ri = ti + r * width * 4;

      let fvR = src[ti], fvG = src[ti + 1], fvB = src[ti + 2];
      let lvR = src[ti + (height - 1) * width * 4], lvG = src[ti + (height - 1) * width * 4 + 1], lvB = src[ti + (height - 1) * width * 4 + 2];

      let valR = (r + 1) * fvR;
      let valG = (r + 1) * fvG;
      let valB = (r + 1) * fvB;

      for (let j = 0; j < r; j++) {
        valR += src[ti + j * width * 4];
        valG += src[ti + j * width * 4 + 1];
        valB += src[ti + j * width * 4 + 2];
      }

      for (let j = 0; j <= r; j++) {
        valR += src[ri] - fvR;
        valG += src[ri + 1] - fvG;
        valB += src[ri + 2] - fvB;
        dst[ti] = valR * iarr;
        dst[ti + 1] = valG * iarr;
        dst[ti + 2] = valB * iarr;
        dst[ti + 3] = src[ti + 3];
        ri += width * 4; ti += width * 4;
      }

      for (let j = r + 1; j < height - r; j++) {
        valR += src[ri] - src[li];
        valG += src[ri + 1] - src[li + 1];
        valB += src[ri + 2] - src[li + 2];
        dst[ti] = valR * iarr;
        dst[ti + 1] = valG * iarr;
        dst[ti + 2] = valB * iarr;
        dst[ti + 3] = src[ti + 3];
        li += width * 4; ri += width * 4; ti += width * 4;
      }

      for (let j = height - r; j < height; j++) {
        valR += lvR - src[li];
        valG += lvG - src[li + 1];
        valB += lvB - src[li + 2];
        dst[ti] = valR * iarr;
        dst[ti + 1] = valG * iarr;
        dst[ti + 2] = valB * iarr;
        dst[ti + 3] = src[ti + 3];
        li += width * 4; ti += width * 4;
      }
    }
  }

  function fastMotionBlur(imgData, width, height, radius, angleDeg) {
    const data = imgData.data;
    const copy = getWorkBuffer(data.length);
    copy.set(data);

    const rad = (angleDeg * Math.PI) / 180;
    const dx = Math.cos(rad);
    const dy = Math.sin(rad);
    const steps = Math.max(3, Math.min(25, Math.round(radius * 0.7)));

    for (let y = 0; y < height; y++) {
      const rowOffset = y * width;
      for (let x = 0; x < width; x++) {
        let sumR = 0, sumG = 0, sumB = 0, count = 0;
        for (let s = -steps; s <= steps; s++) {
          const sx = Math.round(x + s * dx);
          const sy = Math.round(y + s * dy);
          if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
            const idx = (sy * width + sx) * 4;
            sumR += copy[idx];
            sumG += copy[idx + 1];
            sumB += copy[idx + 2];
            count++;
          }
        }
        const outIdx = (rowOffset + x) * 4;
        data[outIdx] = (sumR / count) | 0;
        data[outIdx + 1] = (sumG / count) | 0;
        data[outIdx + 2] = (sumB / count) | 0;
      }
    }
  }

  function applyRadialBlur(imgData, width, height, radius, isZoom = false) {
    const data = imgData.data;
    const copy = getWorkBuffer(data.length);
    copy.set(data);

    const centerX = width * 0.5;
    const centerY = height * 0.5;
    const steps = Math.min(10, Math.max(3, Math.round(radius * 0.25)));

    for (let y = 0; y < height; y++) {
      const rowOffset = y * width;
      for (let x = 0; x < width; x++) {
        let sumR = 0, sumG = 0, sumB = 0, count = 0;
        const vx = x - centerX;
        const vy = y - centerY;

        for (let s = 0; s < steps; s++) {
          const scale = isZoom ? 1 - (s / steps) * (radius * 0.012) : 1;
          let sx, sy;
          if (isZoom) {
            sx = Math.round(centerX + vx * scale);
            sy = Math.round(centerY + vy * scale);
          } else {
            const rot = ((s - steps / 2) * (radius * 0.003));
            sx = Math.round(centerX + vx * Math.cos(rot) - vy * Math.sin(rot));
            sy = Math.round(centerY + vx * Math.sin(rot) + vy * Math.cos(rot));
          }

          if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
            const idx = (sy * width + sx) * 4;
            sumR += copy[idx];
            sumG += copy[idx + 1];
            sumB += copy[idx + 2];
            count++;
          }
        }
        const outIdx = (rowOffset + x) * 4;
        data[outIdx] = (sumR / count) | 0;
        data[outIdx + 1] = (sumG / count) | 0;
        data[outIdx + 2] = (sumB / count) | 0;
      }
    }
  }

  function applyTiltShiftBlur(imgData, width, height, radius, focusPosPct, focusWidthPct) {
    const data = imgData.data;
    const blurred = new Uint8ClampedArray(data);

    fastBoxBlur({ data: blurred }, width, height, radius);

    const focusCenterY = (focusPosPct / 100) * height;
    const clearBandHeight = (focusWidthPct / 100) * height * 0.5;

    for (let y = 0; y < height; y++) {
      const distFromCenter = Math.abs(y - focusCenterY);
      let blurWeight = 0;
      if (distFromCenter > clearBandHeight) {
        blurWeight = Math.min(1.0, (distFromCenter - clearBandHeight) / (height * 0.28));
      }
      const invWeight = 1 - blurWeight;
      const rowOffset = y * width * 4;
      for (let x = 0; x < width; x++) {
        const idx = rowOffset + x * 4;
        data[idx] = (data[idx] * invWeight + blurred[idx] * blurWeight) | 0;
        data[idx + 1] = (data[idx + 1] * invWeight + blurred[idx + 1] * blurWeight) | 0;
        data[idx + 2] = (data[idx + 2] * invWeight + blurred[idx + 2] * blurWeight) | 0;
      }
    }
  }

  function applyBokehBloom(imgData, width, height, radius, thresholdPct) {
    const data = imgData.data;
    const copy = getWorkBuffer(data.length);
    copy.set(data);

    const thresh = (thresholdPct / 100) * 255;
    fastBoxBlur(imgData, width, height, Math.round(radius * 0.6));

    const invThresh = 1 / (255 - thresh || 1);
    for (let i = 0; i < data.length; i += 4) {
      const origR = copy[i];
      const origG = copy[i + 1];
      const origB = copy[i + 2];
      const lum = (origR * 77 + origG * 150 + origB * 29) >> 8;

      if (lum > thresh) {
        const boost = (lum - thresh) * invThresh * 0.8;
        data[i] = Math.min(255, (data[i] + origR * boost) | 0);
        data[i + 1] = Math.min(255, (data[i + 1] + origG * boost) | 0);
        data[i + 2] = Math.min(255, (data[i + 2] + origB * boost) | 0);
      }
    }
  }

  function applyBackgroundSubjectBlur(imgData, width, height, radius, settings) {
    const data = imgData.data;
    const blurred = new Uint8ClampedArray(data);
    fastBoxBlur({ data: blurred }, width, height, radius);

    const cx = width * 0.5;
    const cy = height * 0.5;
    const rx = width * 0.32;
    const ry = height * 0.42;

    for (let y = 0; y < height; y++) {
      const dy = (y - cy) / ry;
      const dy2 = dy * dy;
      const rowOffset = y * width * 4;

      for (let x = 0; x < width; x++) {
        const dx = (x - cx) / rx;
        const dist = Math.sqrt(dx * dx + dy2);
        const blurWeight = Math.max(0, Math.min(1, (dist - 0.7) * 2.2));
        const invWeight = 1 - blurWeight;

        const idx = rowOffset + x * 4;
        data[idx] = (data[idx] * invWeight + blurred[idx] * blurWeight) | 0;
        data[idx + 1] = (data[idx + 1] * invWeight + blurred[idx + 1] * blurWeight) | 0;
        data[idx + 2] = (data[idx + 2] * invWeight + blurred[idx + 2] * blurWeight) | 0;
      }
    }
  }
  // ==========================================================================
  // STUDIO PRESETS
  // ==========================================================================
  function applyStudioPreset(presetKey) {
    if (presetKey === 'crisp-4k') {
      State.features.upscale = true;
      State.upscale.scaleTarget = '4';
      State.upscale.sharpness = 85;
      State.upscale.clarity = 60;
      State.upscale.denoise = 15;
      State.features.gradient = false;
      State.features.noise = false;
      State.features.blur = false;
    } else if (presetKey === '8k-extreme') {
      State.features.upscale = true;
      State.upscale.scaleTarget = '8k';
      State.upscale.sharpness = 90;
      State.upscale.clarity = 75;
      State.upscale.denoise = 10;
      State.features.gradient = false;
      State.features.noise = false;
      State.features.blur = false;
    } else if (presetKey === 'vintage-film') {
      State.features.upscale = true;
      State.upscale.sharpness = 40;
      State.features.gradient = true;
      State.gradient.preset = 'sepia';
      State.gradient.stops = GRADIENT_PRESETS.sepia.map((hex, i) => ({ color: hex, offset: Math.round((i / (GRADIENT_PRESETS.sepia.length - 1)) * 100), opacity: 100 })); renderGradientStopsList();
      State.gradient.blendMode = 'soft-light';
      State.gradient.opacity = 65;
      State.features.noise = true;
      State.noise.type = 'film35';
      State.noise.amount = 45;
      State.noise.distribution = 'midtones';
      State.features.blur = false;
    } else if (presetKey === 'cyberpunk-neon') {
      State.features.upscale = true;
      State.upscale.scaleTarget = '4';
      State.upscale.sharpness = 70;
      State.features.gradient = true;
      State.gradient.preset = 'cyberpunk';
      State.gradient.stops = GRADIENT_PRESETS.cyberpunk.map((hex, i) => ({ color: hex, offset: Math.round((i / (GRADIENT_PRESETS.cyberpunk.length - 1)) * 100), opacity: 100 })); renderGradientStopsList();
      State.gradient.blendMode = 'overlay';
      State.gradient.opacity = 75;
      State.features.noise = true;
      State.noise.type = 'chromatic';
      State.noise.amount = 25;
      State.features.blur = false;
    } else if (presetKey === 'tilt-miniature') {
      State.features.upscale = true;
      State.features.blur = true;
      State.blur.mode = 'tiltshift';
      State.blur.radius = 24;
      State.blur.tiltFocusPos = 50;
      State.blur.tiltFocusWidth = 25;
      State.features.gradient = false;
      State.features.noise = false;
    } else if (presetKey === 'dreamy-bokeh') {
      State.features.upscale = true;
      State.features.blur = true;
      State.blur.mode = 'bokeh';
      State.blur.radius = 18;
      State.blur.bokehThreshold = 70;
      State.features.gradient = true;
      State.gradient.preset = 'sunset';
      State.gradient.stops = GRADIENT_PRESETS.sunset.map((hex, i) => ({ color: hex, offset: Math.round((i / (GRADIENT_PRESETS.sunset.length - 1)) * 100), opacity: 100 })); renderGradientStopsList();
      State.gradient.blendMode = 'soft-light';
      State.gradient.opacity = 50;
      State.features.noise = false;
    }

    syncUIToState();
    requestRender();
    showToast(`Applied preset: ${presetKey.replace('-', ' ').toUpperCase()}`, 2000);
  }

  function syncUIToState() {
    DOM.toggleUpscale.checked = State.features.upscale;
    DOM.toggleGradient.checked = State.features.gradient;
    DOM.toggleNoise.checked = State.features.noise;
    DOM.toggleBlur.checked = State.features.blur;

    DOM.upscaleTag.textContent = State.features.upscale ? `${State.upscale.scaleTarget.toUpperCase()}X Active` : 'Off';
    DOM.gradientTag.textContent = State.features.gradient ? 'Active' : 'Off';
    DOM.noiseTag.textContent = State.features.noise ? `${State.noise.amount}%` : 'Off';
    DOM.blurTag.textContent = State.features.blur ? `${State.blur.radius}px` : 'Off';

    // Scale buttons
    DOM.scaleButtons.forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-scale') === State.upscale.scaleTarget);
    });

    DOM.upscaleSharpness.value = State.upscale.sharpness;
    DOM.upscaleSharpnessVal.textContent = `${State.upscale.sharpness}%`;
    DOM.upscaleClarity.value = State.upscale.clarity;
    DOM.upscaleClarityVal.textContent = `${State.upscale.clarity}%`;
    DOM.upscaleDenoise.value = State.upscale.denoise;
    DOM.upscaleDenoiseVal.textContent = `${State.upscale.denoise}%`;

    // Gradient
    DOM.gradBlendModeSelect.value = State.gradient.blendMode;
    DOM.gradOpacity.value = State.gradient.opacity;
    DOM.gradOpacityVal.textContent = `${State.gradient.opacity}%`;
    renderGradientStopsList();

    // Noise
    DOM.noiseAmount.value = State.noise.amount;
    DOM.noiseAmountVal.textContent = `${State.noise.amount}%`;
    DOM.grainChips.forEach(c => c.classList.toggle('active', c.getAttribute('data-type') === State.noise.type));

    // Blur
    DOM.blurChips.forEach(c => c.classList.toggle('active', c.getAttribute('data-blur') === State.blur.mode));
    DOM.blurRadius.value = State.blur.radius;
    DOM.blurRadiusVal.textContent = `${State.blur.radius} px`;
    updateBlurSubcontrols();

    updatePipelineTags();
    updateResolutionBadges();
  }

  function resetAllAdjustments() {
    State.features.upscale = true;
    State.upscale.scaleTarget = '4';
    State.upscale.sharpness = 65;
    State.upscale.clarity = 45;
    State.upscale.denoise = 20;

    State.features.gradient = false;
    State.gradient.preset = 'cyberpunk';
    State.gradient.stops = GRADIENT_PRESETS.cyberpunk.map((hex, i) => ({ color: hex, offset: Math.round((i / (GRADIENT_PRESETS.cyberpunk.length - 1)) * 100), opacity: 100 })); renderGradientStopsList();
    State.gradient.blendMode = 'overlay';
    State.gradient.opacity = 85;

    State.features.noise = false;
    State.noise.amount = 35;
    State.noise.type = 'film35';

    State.features.blur = false;
    State.blur.radius = 15;
    State.blur.mode = 'gaussian';

    syncUIToState();
    fitCanvasToViewport();
    requestRender();
    showToast('Reset all adjustments to default', 2000);
  }

  // ==========================================================================
  // EXPORT ENGINE (TRUE 4K / 8K RENDERING & DOWNLOAD)
  // ==========================================================================
  function openExportModal() {
    DOM.exportModal.style.display = 'flex';
    updateExportSummary();
  }

  function closeExportModal() {
    DOM.exportModal.style.display = 'none';
    DOM.exportProgressWrap.style.display = 'none';
  }

  function updateExportSummary() {
    const selectedRadio = document.querySelector('input[name="exportResolution"]:checked');
    const resMode = selectedRadio ? selectedRadio.value : 'native';

    let targetDim;
    if (resMode === 'native') {
      targetDim = { width: State.sourceWidth, height: State.sourceHeight };
    } else {
      targetDim = calculateTargetDimensions(State.sourceWidth, State.sourceHeight, resMode);
    }

    const mp = ((targetDim.width * targetDim.height) / 1000000).toFixed(1);
    DOM.summaryDimensionsText.textContent = `${targetDim.width} × ${targetDim.height} px`;
    DOM.summaryMegapixelsText.textContent = `${mp} Megapixels (${resMode.toUpperCase()})`;

    const activeFx = [];
    if (State.features.upscale) activeFx.push(`Upscale (${resMode.toUpperCase()})`);
    if (State.features.gradient) activeFx.push('Gradient Map');
    if (State.features.noise) activeFx.push('Film Grain');
    if (State.features.blur) activeFx.push('Blur Studio');
    DOM.summaryPipelineText.textContent = activeFx.join(' + ') || 'Original Master';
  }

  function executeExportDownload() {
    const selectedRadio = document.querySelector('input[name="exportResolution"]:checked');
    const resMode = selectedRadio ? selectedRadio.value : 'native';
    const format = DOM.exportFormatSelect.value;
    const quality = DOM.exportQualitySlider.value / 100;

    let targetDim;
    if (resMode === 'native') {
      targetDim = { width: State.sourceWidth, height: State.sourceHeight };
    } else {
      targetDim = calculateTargetDimensions(State.sourceWidth, State.sourceHeight, resMode);
    }

    // Show Progress Bar
    DOM.exportProgressWrap.style.display = 'block';
    DOM.startExportDownloadBtn.disabled = true;
    DOM.downloadBtnText.textContent = 'Rendering...';

    updateExportProgress(15, 'Allocating ultra-high resolution canvas...');

    setTimeout(() => {
      try {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = targetDim.width;
        offscreenCanvas.height = targetDim.height;
        const ctx = offscreenCanvas.getContext('2d', { willReadFrequently: true });

        // High quality multi-step resampling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        updateExportProgress(35, `Resampling to ${targetDim.width} × ${targetDim.height}...`);
        ctx.drawImage(State.sourceImage, 0, 0, targetDim.width, targetDim.height);

        updateExportProgress(55, 'Applying neural sharpness & AI FX pipeline...');
        let imgData = ctx.getImageData(0, 0, targetDim.width, targetDim.height);

        // Apply same FX pipeline scaled to high res
        if (State.features.upscale) {
          applyUpscaleDetailEnhancement(imgData, targetDim.width, targetDim.height, State.upscale);
        }

        if (State.features.blur && State.blur.radius > 0) {
          const scaledBlur = Object.assign({}, State.blur, {
            radius: Math.round(State.blur.radius * (targetDim.width / State.sourceWidth))
          });
          applyBlurFilter(imgData, targetDim.width, targetDim.height, scaledBlur);
        }

        if (State.features.gradient) {
          applyGradientMap(imgData, targetDim.width, targetDim.height, State.gradient);
        }

        if (State.features.noise && State.noise.amount > 0) {
          applyFilmGrain(imgData, targetDim.width, targetDim.height, State.noise);
        }

        ctx.putImageData(imgData, 0, 0);

        updateExportProgress(85, 'Encoding compressed image file...');

        const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
        const fileExt = format === 'jpeg' ? 'jpg' : format;

        setTimeout(() => {
          offscreenCanvas.toBlob((blob) => {
            if (!blob) {
              alert('Could not generate export file. Browser memory limits may be reached.');
              resetExportButton();
              return;
            }

            updateExportProgress(100, 'Download complete!');

            const downloadUrl = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `lumina_${resMode}_${targetDim.width}x${targetDim.height}_${Date.now()}.${fileExt}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(downloadUrl);

            setTimeout(() => {
              resetExportButton();
              closeExportModal();
              showToast(`Exported ${targetDim.width}×${targetDim.height} (${resMode.toUpperCase()}) successfully!`, 3000);
            }, 600);
          }, mimeType, quality);
        }, 100);

      } catch (err) {
        console.error('Export error:', err);
        alert('Export error: ' + err.message);
        resetExportButton();
      }
    }, 100);
  }

  function updateExportProgress(pct, statusText) {
    DOM.exportProgressBarFill.style.width = `${pct}%`;
    DOM.exportProgressPercent.textContent = `${pct}%`;
    DOM.exportProgressStateText.textContent = statusText;
  }

  function resetExportButton() {
    DOM.startExportDownloadBtn.disabled = false;
    DOM.downloadBtnText.textContent = 'Render & Download';
  }

  async function copyCanvasToClipboard() {
    try {
      DOM.processedCanvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          showToast('Image copied to clipboard!', 2500);
        } catch (err) {
          console.warn('Clipboard write failed:', err);
          showToast('Clipboard access denied by browser', 2500);
        }
      }, 'image/png');
    } catch (e) {
      console.warn(e);
    }
  }

  // ==========================================================================
  // HELPERS
  // ==========================================================================
  function setupSlider(inputEl, displayEl, unit, callback) {
    inputEl.addEventListener('input', (e) => {
      displayEl.textContent = `${e.target.value}${unit}`;
      callback(e.target.value);
    });
  }

  function showToast(text, duration = 0) {
    DOM.processingStatusText.textContent = text;
    DOM.processingToast.classList.add('show');
    if (duration > 0) {
      setTimeout(hideToast, duration);
    }
  }

  function hideToast() {
    DOM.processingToast.classList.remove('show');
  }

  function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  function debounce(func, wait) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

})();
