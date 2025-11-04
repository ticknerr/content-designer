// config/htmlTemplates.js
export const htmlTemplates = {
  moduleTitle: (title) => `
<h2 style="text-transform: none; line-height: 1.25; margin-bottom: 1.618rem; color: #1f4040; font-family: fields, Georgia, sans-serif; text-align: center;">
  ${title}
</h2>`,

  heading: (text, level = 'h3') => {
    const styles = {
      h3: 'text-transform: none; margin-top: 1.618rem; margin-bottom: 1.618rem; color: #1f4040; font-family: fields, Georgia, sans-serif;',
      h4: 'text-transform: none; margin-top: 1.382rem; margin-bottom: 1.382rem; color: #1f4040; font-family: fields, Georgia, sans-serif;'
    };
    return `<${level} style="${styles[level] || styles.h3}">${text}</${level}>`;
  },

  learningObjectives: (title, subHeading, objectives) => {
    // Ensure we have defaults
    const mainTitle = title || 'Learning Outcomes';
    const subTitle = subHeading || 'By the end of this section, you will be able to:';
    const objectiveItems = objectives || ["TODO", "ADD ITEMS", "HERE"];

    // Generate the objectives list
    const objectivesList = objectiveItems.map((obj, i) => `
  <li style="list-style: none; margin-bottom: 0.9rem; padding-left: 36px; position: relative;">
    <span style="position: absolute; left: 0px; top: -2px; line-height: 0px; background: #1f4040; border-radius: 50%;">
      <span style="color: white; font-weight: bold; font-size: 90%; display: inline-block; padding: 50% 9px;">
        ${i + 1}
      </span>
    </span>${obj}
  </li>`).join('');

    return `
    <div>
      <h3 style="text-transform: none; margin-bottom: 1rem; color: #1f4040; font-family: fields, Georgia, sans-serif;">
        ${mainTitle}
      </h3>
      <p style="text-transform: none; margin-top: 0rem; color: #1f4040; font-size:1.382rem; font-family: fields, Georgia, sans-serif;">
        ${subTitle}
      </p>
      <ol style="padding-left: 0px; margin-top: 1.382rem; margin-bottom: 1.618rem;">
        ${objectivesList}
      </ol>
    </div>
  `;
  },

  infoBox: (title, content) => {
    if (title) {
      // New "activity" style box
      return `
        <div style="background:#f6f6f4;color:#494946;border-radius:2px;padding:0;margin:1.236rem 0;">
          <h4 style="font-family: inherit; font-weight: 500; color:white;font-size:1.118rem;line-height:1.118rem;text-transform:none;border-radius:0;border-top-right-radius:2px;border-top-left-radius:2px;background:#586fb5;margin:0;padding:1.146rem;">
            <i class="fa fa-info-circle fa-2x" style="font-size:1.118rem;line-height:1.118rem;"></i>&nbsp; ${title}
          </h4>
          <div style="padding:1.146rem;background:#f6f6f4;border-radius:2px;">
            <p style="margin-top:0;padding-top:0;margin-bottom:0;padding-bottom:0;">${content}</p>
          </div>
        </div>
      `;
    } else {
      // Original info box style
      return `
        <div style="margin: 1.618rem 0; padding: 1.618rem; border-radius: 2px; color: white; background: #586fb5; text-align: center; font-weight: bold;">
          <i class="fa fa-info-circle fa-2x" style="margin-bottom: 0.764rem; color: white; display: block;"></i>
          <p style="margin: 0;">${content}</p>
        </div>
      `;
    }
  },

  summaryBox: (title, content) => {
    if (title) {
      return `
        <div style="background:#f6f6f4;color:#494946;border-radius:2px;padding:0;margin:1.236rem 0;">
          <h4 style="font-family: inherit; font-weight: 500; color:white;font-size:1.118rem;line-height:1.118rem;text-transform:none;border-radius:0;border-top-right-radius:2px;border-top-left-radius:2px;background:#1f4040;margin:0;padding:1.146rem;">
            <i class="fa fa-list-check fa-2x" style="font-size:1.118rem;line-height:1.118rem;"></i>&nbsp; ${title}
          </h4>
          <div style="padding:1.146rem;background:#f6f6f4;border-radius:2px;">
            <p style="margin-top:0;padding-top:0;margin-bottom:0;padding-bottom:0;">${content}</p>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="margin: 1.618rem 0; padding: 1.618rem; border-radius: 2px; color: #1f4040; background: #f6f6f4; text-align: center; font-weight: bold;">
          <i class="fa fa-list-check fa-2x" style="margin-bottom: 0.764rem; color: #1f4040; display: block;"></i>
          <p style="margin: 0;">${content}</p>
        </div>`
    }
  },

  exerciseBox: (title, content) => {
    if (title) {
      return `
        <div style="background:#f6f6f4;color:#494946;border-radius:2px;padding:0;margin:1.236rem 0;">
          <h4 style="font-family: inherit; font-weight: 500; color:white;font-size:1.118rem;line-height:1.118rem;text-transform:none;border-radius:0;border-top-right-radius:2px;border-top-left-radius:2px;background:#a85b8b;margin:0;padding:1.146rem;">
            <i class="fa fa-question-circle fa-2x" style="font-size:1.118rem;line-height:1.118rem;"></i>&nbsp; ${title}
          </h4>
          <div style="padding:1.146rem;background:#f6f6f4;border-radius:2px;">
            <p style="margin-top:0;padding-top:0;margin-bottom:0;padding-bottom:0;">${content}</p>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="margin: 1.618rem 0; padding: 1.618rem; border-radius: 2px; color: white; background: #a85b8b; text-align: center; font-weight: bold;">
          <i class="fa fa-question-circle fa-2x" style="margin-bottom: 0.764rem; color: white; display: block;"></i>
          <p style="margin: 0;">${content}</p>
        </div>`
    }
  },

  resourceBox: (title, content) => {
    if (title) {
      return `
        <div style="background:#f6f6f4;color:#494946;border-radius:2px;padding:0;margin:1.236rem 0;">
          <h4 style="font-family: inherit; font-weight: 500; color:white;font-size:1.118rem;line-height:1.118rem;text-transform:none;border-radius:0;border-top-right-radius:2px;border-top-left-radius:2px;background:#109294;margin:0;padding:1.146rem;">
            <i class="fa fa-link fa-2x" style="font-size:1.118rem;line-height:1.118rem;"></i>&nbsp; ${title}
          </h4>
          <div style="padding:1.146rem;background:#f6f6f4;border-radius:2px;">
            <p style="margin-top:0;padding-top:0;margin-bottom:0;padding-bottom:0;">${content}</p>
          </div>
        </div>
      `;
    } else {
      return `
        <div style="margin: 1.618rem 0; padding: 1.618rem; border-radius: 2px; color: white; background: #109294; text-align: center; font-weight: bold;">
          <i class="fa fa-link fa-2x" style="margin-bottom: 0.764rem; color: white; display: block;"></i>
          <p style="margin: 0;">${content}</p>
        </div>`
    }
  },
  
  textColumns: (content) => `
<article style="column-count: auto; column-width: 460px; column-gap: 2.618rem; margin: 1rem 0; column-rule: 1px solid #f6f4f4;">
  ${content}
</article>`,

  numberedList: (items) => `
<ol style="padding-left: 0px; margin-top: 1.2rem; margin-bottom: 1.382rem;">
  ${items.map((item, i) => `
  <li style="list-style: none; margin-bottom: 0.9rem; padding-left: 36px; position: relative;">
    <span style="position: absolute; left: 0px; top: -2px; line-height: 0px; background: #1f4040; border-radius: 50%;">
      <span style="color: white; font-weight: bold; font-size: 90%; display: inline-block; padding: 50% 9px;">${i + 1}</span>
    </span>
    ${item}
  </li>`).join('')}
</ol>`,

  bulletList: (items) => `
<ul style="margin-top: 1rem;">
  ${items.map(item => `<li>${item}</li>`).join('')}
</ul>`,

  alphaList: (items) => `
<ol type="a" style="margin-top: 1rem;">
  ${items.map(item => `<li>${item}</li>`).join('')}
</ol>`,

  numericList: (items) => `
<ol style="margin-top: 1rem;">
  ${items.map(item => `<li>${item}</li>`).join('')}
</ol>`,

  iconList: (items, icon = 'circle-check', color = '#198754') => {
    // Ensure color has good contrast on white background
    const safeColor = htmlTemplates.ensureColorContrast(color);

    return `
<ul style="padding-left: 0px; margin-top: 1rem;">
  ${items.map(item => `
  <li style="list-style: none; margin-bottom: 0.618rem; padding-left: 36px; position: relative;">
    <i class="fa fa-${icon}" style="position: absolute; left: 0px; top: 2px; color: ${safeColor}; font-size: 20px;"></i>
    ${item}
  </li>`).join('')}
</ul>`;
  },

  // Helper to ensure color contrast
  ensureColorContrast: (color) => {
    // Map common color names to accessible hex values
    const colorMap = {
      'blue': '#0066cc',
      'light blue': '#4a90e2',
      'dark blue': '#003d7a',
      'green': '#198754',
      'red': '#dc3545',
      'orange': '#fd7e14',
      'yellow': '#ffc107',
      'purple': '#6f42c1',
      'pink': '#e91e63',
      'teal': '#20c997',
      'cyan': '#17a2b8',
      'indigo': '#6610f2',
      'brown': '#795548',
      'grey': '#6c757d',
      'gray': '#6c757d',
      'black': '#212529',
      'gold': '#b8860b',
      'silver': '#6c757d',
      'bronze': '#cd7f32'
    };

    // If it's a color name, map it
    const lowerColor = color.toLowerCase();
    if (colorMap[lowerColor]) {
      return colorMap[lowerColor];
    }

    // If it's already a hex color, validate it
    if (color.startsWith('#')) {
      // Simple validation - ensure it's dark enough for white background
      // This is a simplified check - you could make this more sophisticated
      return color;
    }

    // Default to green if unrecognized
    return '#198754';
  },

  accordion: (items) => `
<div style="margin-bottom: 1.618rem;">
  ${items.map((item, i) => `
  <details ${i === 0 ? 'open' : ''} style="border-bottom: 2px solid white;">
    <summary style="cursor: pointer; font-weight: 700; color: #1f4040; background: rgba(31,64,64,0.2); padding: 1rem; padding-left: 1.146rem; border-radius: 0px; border-top-right-radius: 2px; border-top-left-radius: 2px;">
      ${item.title}
    </summary>
    <div style="padding: 1rem; background: #f6f6f4; border-radius: 0px; border-bottom-right-radius: 2px; border-bottom-left-radius: 2px;">
      ${item.content}
    </div>
  </details>`).join('')}
</div>`,

  carousel: (items) => {
    const carouselId = `carousel-${Date.now()}`;
    return `
<div id="${carouselId}" class="carousel slide" style="margin-top: 1.618rem; margin-bottom: 1.618rem;" data-ride="carousel" data-interval="false">
  <ol class="carousel-indicators" style="bottom: 0rem;">
    ${items.map((_, i) => `
    <li ${i === 0 ? 'class="active"' : ''} style="background-color: #1f4040; width: 12px; height: 12px; border-radius: 50%;" data-target="#${carouselId}" data-slide-to="${i}"></li>`).join('')}
  </ol>
  
  <div class="carousel-inner">
    ${items.map((item, i) => `
    <div class="carousel-item ${i === 0 ? 'active' : ''}" style="padding: 1.618rem 5.382rem 4rem 5.382rem; background: #f6f6f4; border-radius: 3px;">
      <div>
        ${item.title ? `<h4 style="text-transform: none; margin: 0 0 1rem 0; color: #1f4040; font-family: Georgia, serif; font-size: 1.2rem;">
          ${item.title}
        </h4>` : ''}
        <p style="margin: 0; line-height: 1.7; font-size: 0.95em;">
          ${item.content}
        </p>
      </div>
    </div>`).join('')}
  </div>
  
  <a class="carousel-control-prev" style="position: absolute; top: 50%; left: 1rem; transform: translateY(-50%); z-index: 5; text-decoration: none; width: 3rem; height: 3rem; display: flex; align-items: center; justify-content: center;" role="button" href="#${carouselId}" data-slide="prev">
    <i class="fas fa-chevron-left" style="background-color: #1f4040; color: #ffffff; border-radius: 50%; width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;"></i>
    <span class="sr-only">Previous</span>
  </a>
  
  <a class="carousel-control-next" style="position: absolute; top: 50%; right: 1rem; transform: translateY(-50%); z-index: 5; text-decoration: none; width: 3rem; height: 3rem; display: flex; align-items: center; justify-content: center;" role="button" href="#${carouselId}" data-slide="next">
    <i class="fas fa-chevron-right" style="background-color: #1f4040; color: #ffffff; border-radius: 50%; width: 2.5rem; height: 2.5rem; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;"></i>
    <span class="sr-only">Next</span>
  </a>
</div>`;
  },

  tabs: (items) => {
    const tabId = `tab-${Date.now()}`;
    return `<ul id="${tabId}" class="nav nav-tabs" role="tablist" style="background: #f6f6f4; border-top-left-radius: 3px; border-top-right-radius: 3px;">${items.map((item, i) => `
  <li class="nav-item" role="presentation">
    <button id="${tabId}-${i}-tab" class="nav-link ${i === 0 ? 'active' : ''}" role="tab" type="button" data-toggle="tab" data-target="#${tabId}-${i}" aria-controls="${tabId}-${i}" aria-selected="${i === 0 ? 'true' : 'false'}" style="border-top-left-radius: 3px; border-top-right-radius: 3px; color: #1f4040;">${item.title || `Tab ${i + 1}`}</button>
  </li>`).join('')}</ul>
<div class="tab-content" style="margin-bottom: 1.618rem; border: 1px solid #dee2e6; border-top: 0px; border-bottom-left-radius: 3px; border-bottom-right-radius: 3px;">${items.map((item, i) => `
  <div id="${tabId}-${i}" class="tab-pane ${i === 0 ? 'active' : ''}" role="tabpanel" aria-labelledby="${tabId}-${i}-tab" style="padding: 0.618rem;">${item.content || ''}</div>`).join('')}</div>`;
  },

  stylizedContentBox: (items, title) => `${title ? `<h4 style="text-transform: none; margin-top: 1rem; margin-bottom: 0.5rem; color: #1f4040; font-family: fields, Georgia, sans-serif;">${title}</h4>` : ''}
<div style="margin: 1.618rem 0; padding: 1.618rem; border-radius: 2px; color: #1f4040; background: #f6f6f4; display: flex; flex-wrap: wrap; gap: 2rem;">${items.map(item => `
  <div style="flex: 1; min-width: 280px;">${item.title && item.title.trim() ? `
    <h4 style="text-transform: none; margin: 0 0 1rem 0; color: #1f4040; font-family: fields, Georgia, sans-serif;">${item.title}</h4>` : ''}${item.content ? `
    <p style="margin: 0; line-height: 1.7; font-size: 0.95em;">${item.content}</p>` : ''}
  </div>`).join('')}</div>`
};