import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  Renderer2,
  signal,
  Signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { DropdownOption } from '../dropdown/dropdown.component';
import dayjs from 'dayjs';
import {
  Diff2HtmlUIConfig,
  Diff2HtmlUI,
} from 'diff2html/lib/ui/js/diff2html-ui';
import { createPatch } from 'diff';
import { valid } from 'node-html-parser';
import { load } from 'cheerio/lib/slim';
import { Diff } from '@ali-tas/htmldiff-js';
import { RadioOption } from '../radio/radio.component';
import { I18nFacade } from '@dua-upd/upd/state';
import { FR_CA } from '@dua-upd/upd/i18n';
interface DiffOptions {
  repeatingWordsAccuracy?: number;
  ignoreWhiteSpaceDifferences?: boolean;
  orphanMatchThreshold?: number;
  matchGranularity?: number;
  combineWords?: boolean;
}

interface MainConfig {
  outputFormat: 'side-by-side' | 'line-by-line';
  viewMode: { value: string; label: string; description: string };
}

interface PageConfig {
  before: HashSelection | null;
  after: HashSelection | null;
}

interface HashSelection {
  hash: string;
  date: Date;
  blob: string;
}

@Component({
  selector: 'upd-page-version',
  templateUrl: './page-version.component.html',
  styleUrls: ['./page-version.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class PageVersionComponent {
  i18n = inject(I18nFacade);
  hashes = input<HashSelection[]>([]);
  url = input<string>('');
  shadowDOM = signal<ShadowRoot | null>(null);

  sourceContainer = viewChild<ElementRef<HTMLElement>>('sourceContainer');
  liveContainer = viewChild<ElementRef<HTMLElement>>('liveContainer');
  beforeContainer = viewChild<ElementRef<HTMLElement>>('beforeContainer');
  afterContainer = viewChild<ElementRef<HTMLElement>>('afterContainer');

  outputFormat = signal<'side-by-side' | 'line-by-line'>('side-by-side');
  viewMode = signal<RadioOption<string>>({
    label: 'Live View',
    value: 'live',
    description: 'View the live page',
  });

  before = signal<HashSelection | null>(null);
  after = signal<HashSelection | null>(null);

  currentLang = this.i18n.currentLang;
  dateParams = computed(() => {
    return this.currentLang() == FR_CA ? 'DD MMM YYYY' : 'MMM DD, YYYY';
  });

  dropdownOptions: Signal<DropdownOption<string>[]> = computed(() => {
    const current = this.hashes()[0]?.hash;

    return this.hashes().map(({ hash, date }) => ({
      label: `${dayjs(date).format(this.dateParams())}${hash === current ? ' (Current)' : ''}`,
      value: hash,
    }));
  });
  sourceFormatOptions: DropdownOption<string>[] = [
    { label: 'Side by side', value: 'side-by-side' },
    { label: 'Unified', value: 'line-by-line' },
  ];

  liveFormatOptions: DropdownOption<string>[] = [
    { label: 'Side by side', value: 'side-by-side' },
    { label: 'Unified', value: 'line-by-line' },
  ];

  viewModeOptions: RadioOption<string>[] = [
    { label: 'Live View', value: 'live', description: '' },
    {
      label: 'Page Source',
      value: 'source',
      description: '',
    },
  ];

  versionConfig = computed<PageConfig>(() => ({
    before: this.before(),
    after: this.after(),
  }));

  config = computed(() => ({
    outputFormat: this.outputFormat(),
    viewMode: this.viewMode(),
  }));

  elements = signal<string[]>([]);
  currentSlide = signal<number>(0);
  scrollElement = viewChild<ElementRef<HTMLElement>>('scrollElement');
  currentIndex = signal<number>(0);
  lastExpandedDetails = signal<HTMLElement | null>(null);

  legendItems = signal<
    { text: string; colour: string; style: string; lineStyle?: string }[]
  >([
    { text: 'Previous version', colour: '#F3A59D', style: 'highlight' },
    { text: 'Updated version', colour: '#83d5a8', style: 'highlight' },
    { text: 'Hidden content', colour: '#6F9FFF', style: 'line' },
    {
      text: 'Modal content',
      colour: '#666',
      style: 'line',
      lineStyle: 'dashed',
    },
    {
      text: 'Ajax-loaded content',
      colour: '#000',
      style: 'line',
    }
  ]);

  constructor(private renderer: Renderer2) {
    effect(() => {
      const liveContainer = this.liveContainer()?.nativeElement;
      if (!liveContainer) return;

      const shadowDOM = this.shadowDOM()?.innerHTML;
      if (!shadowDOM) return;

      const diffViewer = liveContainer.querySelector(
        'diff-viewer',
      ) as HTMLElement;

      if (!diffViewer || !diffViewer.shadowRoot) return;

      this.renderer.listen(
        diffViewer.shadowRoot,
        'click',
        this.handleDocumentClick.bind(this),
      );
    });

    // effect(() => {
    //   const liveContainer = this.liveContainer()?.nativeElement;
    //   if (!liveContainer) return;

    //   const shadowDOM = this.shadowDOM()?.innerHTML;
    //   if (!shadowDOM) return;

    //   const diffViewer = liveContainer.querySelector(
    //     'diff-viewer',
    //   ) as HTMLElement;

    //   if (!diffViewer || !diffViewer.shadowRoot) return;

    //   this.renderer.listen(diffViewer.shadowRoot, 'click', (event: Event) => {
    //     const target = event.target as HTMLElement;

    //     // Check if the clicked element is an anchor tag with an href starting with #
    //     if (
    //       target.tagName === 'A' &&
    //       target.getAttribute('href')?.startsWith('#')
    //     ) {
    //       event.preventDefault(); // Prevent default anchor behavior

    //       const sectionId = target.getAttribute('href')?.substring(1); // Extract ID (removes the #)
    //       const targetSection = diffViewer.shadowRoot?.getElementById(
    //         sectionId ?? '',
    //       );

    //       if (targetSection) {
    //         // Scroll smoothly to the target section
    //         targetSection.scrollIntoView({
    //           behavior: 'smooth',
    //           block: 'start',
    //         });
    //       }
    //     }
    //   });
    // });

    effect(
      () => {
        const storedConfig = this.getStoredConfig();
        if (storedConfig) {
          this.restoreConfig(storedConfig);
        } else {
          this.useDefaultSelection();
        }
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        const storedConfig = JSON.parse(
          sessionStorage.getItem(`main-version-config`) || 'null',
        );

        if (storedConfig) {
          this.restoreMainConfig(storedConfig);
        }
      },
      { allowSignalWrites: true },
    );

    effect(
      () => {
        const container = this.sourceContainer();
        if (!container) return;

        this.createHtmlDiffContent(container);

        this.storeConfig();
      },
      { allowSignalWrites: true },
    );

    effect(
      async () => {
        const container = this.liveContainer();
        if (!container) return;

        try {
          const { liveDiffs, leftBlobContent, rightBlobContent } =
            await this.createLiveDiffContent();
          this.renderLiveDifferences(
            liveDiffs,
            leftBlobContent,
            rightBlobContent,
          );
          this.storeConfig();
        } catch (error) {
          console.error('Error in live diff effect:', error);
        }
      },
      { allowSignalWrites: true },
    );
  }

  private handleDocumentClick(event: MouseEvent): void {
    const liveContainer = this.liveContainer()?.nativeElement;
    if (!liveContainer) return;

    const diffViewer = liveContainer.querySelector(
      'diff-viewer',
    ) as HTMLElement;
    if (!diffViewer || !diffViewer.shadowRoot) return;

    let target = event.target as HTMLElement;
    while (target && target.tagName !== 'A') {
      target = target.parentElement as HTMLElement;
    }

    if (
      target?.tagName === 'A' &&
      target.getAttribute('href')?.startsWith('#')
    ) {
      event.preventDefault();
      const sectionId = target.getAttribute('href')?.substring(1); // Extract ID (removes the #)
      const targetSection = diffViewer.shadowRoot?.getElementById(
        sectionId ?? '',
      );

      if (targetSection) {
        targetSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }
    } else {
      const changeElements = Array.from(
        diffViewer.shadowRoot.querySelectorAll<HTMLElement>('[data-id]'),
      );

      if (!changeElements.length) return;

      const clickedElement = changeElements.find((el) =>
        el.contains(event.target as Node),
      );

      if (!clickedElement) return;
      const index = Number(clickedElement.getAttribute('data-id'));
      this.scrollToElement(index);
    }
  }
  private getStoredConfig(): PageConfig | null {
    const currentUrl = this.url();
    return currentUrl
      ? JSON.parse(
          sessionStorage.getItem(`${currentUrl}-version-config`) || 'null',
        )
      : null;
  }

  private storeConfig(): void {
    const currentUrl = this.url();
    sessionStorage.setItem(
      `${currentUrl}-version-config`,
      JSON.stringify(this.versionConfig()),
    );
  }

  private createHtmlDiffContent(container: ElementRef<HTMLElement>) {
    const leftBlob = this.before()?.blob || '';
    const rightBlob = this.after()?.blob || '';

    const patch = createPatch('', leftBlob, rightBlob, '', '');
    const diffOptions: Diff2HtmlUIConfig = {
      outputFormat: this.outputFormat(),
      drawFileList: false,
      fileContentToggle: false,
      matching: 'words',
    };

    const diff2 = new Diff2HtmlUI(container.nativeElement, patch, diffOptions);
    diff2.draw();
  }

  private async renderLiveDifferences(
    differences: string,
    left: string,
    right: string,
  ): Promise<void> {
    const liveContainer = this.liveContainer();
    if (!liveContainer) return;

    let element = liveContainer.nativeElement.querySelector('diff-viewer');
    if (!element) {
      element = document.createElement('diff-viewer');
      liveContainer.nativeElement.appendChild(element);
    }

    const shadowDOM =
      element.shadowRoot || element.attachShadow({ mode: 'open' });

    // const fontAwesomeCss = this.httpClient.getCache(
    //   'https://use.fontawesome.com/releases/v5.15.4/css/all.css',
    // );
    // const wetBoewCss = this.httpCache.getCached(
    //   'https://www.canada.ca/etc/designs/canada/wet-boew/css/theme.min.css',
    // );

    const parser = new DOMParser();
    const sanitizedUnifiedContent = parser.parseFromString(
      differences,
      'text/html',
    ).body.innerHTML;

    //     ${fontAwesomeCss() || ''}
    // ${wetBoewCss() || ''}
    shadowDOM.innerHTML = `
      <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.15.4/css/all.css"/>
      <link rel="stylesheet" href="https://www.canada.ca/etc/designs/canada/wet-boew/css/theme.min.css"/>
      <link rel="stylesheet" href="https://www.canada.ca/etc/designs/canada/wet-boew/méli-mélo/2024-09-kejimkujik.min.css" crossorigin="anonymous" integrity="sha384-G6/REI+fqg3y/BLFAY+CvJtr+5uK4A96h1v5fIJAmeHqbJdCOE99tmE6CeicCHQv"/>
      <style>
        ins,
        del {
          display: inline-block;
          padding: 0 .3em;
          height: auto;
          border-radius: .3em;
          display: inline;
          -webkit-box-decoration-break: clone;
          -o-box-decoration-break: clone;
          box-decoration-break: clone;
          margin-left: .07em;
          margin-right: .07em;
        }

        ins {
          background: #83d5a8;
          text-decoration: none;
        }

        del {
          background: #F3A59D;
          text-decoration: strikethrough;
        }
          
        del.highlight, ins.highlight {
          border: #000 2px dotted;
          display: inline;
          padding: 0 .35em 0em 0.35em;
          line-height: unset;
          position: unset;
          top: unset;
          height: unset;
          transition: padding-left ease .3s, padding-right ease .3s, color ease .7s;
        }
    </style>
    <div class="diff-container">
        <div>${sanitizedUnifiedContent}</div>
    </div>
    `;

    await this.adjustDOM(shadowDOM);
  }

  private async adjustDOM(shadowDOM: ShadowRoot) {
    const $ = load(shadowDOM.innerHTML);

    const seen = new Set<string>();

    $('del>del, ins>ins').each((index, element) => {
      const $element = $(element);
      const parent = $element.parent();
      if (parent.text().trim() === $element.text().trim()) {
        parent.replaceWith($element);
      }
    });

    $('del>ins, ins>del').each((index, element) => {
      const $element = $(element);
      const parentText = $element.parent();
      const childText = $element.text();
      if (parentText.text().trim() === childText.trim()) {
        parentText.replaceWith($element);
      }
    });

    shadowDOM.innerHTML = $.html();

    const uniqueElements = $('ins, del')
      .toArray()
      .map((element) => {
        const $element = $(element);
        const parent = $element.parent();

        const outerHTML = parent?.html()?.replace(/\n/g, '').trim() || '';
        const contentOnly = parent?.text().trim() || '';
        const normalizedContent = $element
          .text()
          .trim()
          .replace(/\s|&nbsp;/g, '');

        return { element: $element, normalizedContent, outerHTML, contentOnly };
      });
    // .filter(({ normalizedContent, contentOnly }) => {
    //   if (!normalizedContent || !contentOnly || seen.has(contentOnly)) {
    //     return false;
    //   }
    //   seen.add(contentOnly);
    //   return true;
    // });

    uniqueElements.forEach(({ element }, index) => {
      element.attr('data-id', `${index + 1}`); // Start from 1 instead of 0
    });

    shadowDOM.innerHTML = $.html();

    this.elements.set(uniqueElements.map(({ outerHTML }) => outerHTML));
    this.currentIndex.set(0);
    this.shadowDOM.set(shadowDOM);
  }

  private async extractContent(html: string): Promise<string> {
    const $ = load(html);
    const baseUrl = 'https://www.canada.ca';

    /**
     * Fetches content from a URL and returns it as text.
     */
    const fetchUrl = async (url: string): Promise<string> => {
      try {
        const response = await fetch(url);
        return await response.text();
      } catch (error) {
        console.error(`Error fetching URL: ${url}`, error);
        return '';
      }
    };

    const processAjaxReplacements = async () => {
      const processElements = async () => {
        const ajaxElements = $(
          '[data-ajax-replace^="/"], [data-ajax-after^="/"], [data-ajax-append^="/"], [data-ajax-before^="/"], [data-ajax-prepend^="/"]',
        ).toArray();
        if (!ajaxElements.length) return;

        for (const element of ajaxElements) {
          const $el = $(element);
          const tag = $el.prop('tagName').toLowerCase();
          const attributes = $el.attr();

          for (const [attr, ajaxUrl] of Object.entries(attributes || {})) {
            if (!attr.startsWith('data-ajax-') || !ajaxUrl.startsWith('/'))
              continue;

            const [url, anchor] = ajaxUrl.split('#');
            const fullUrl = `${baseUrl}${url}`;
            const $ajaxContent = load(await fetchUrl(fullUrl));

            const content = anchor
              ? $ajaxContent(`#${anchor}`)
                  .map((_, e) => $(e))
                  .toArray()
                  .join('')
              : $ajaxContent.html();

            if (!content) continue;

            const styledContent = `
              <div style="border: 3px solid #000;"> <${tag}>${content}</${tag}> </div>
            `;

            $el.replaceWith(styledContent);
          }
        }
      };

      let previousCount;
      let currentCount = 0;

      do {
        previousCount = currentCount;
        await processElements();
        currentCount = $(
          '[data-ajax-replace^="/"], [data-ajax-after^="/"], [data-ajax-append^="/"], [data-ajax-before^="/"], [data-ajax-prepend^="/"]',
        ).length;
      } while (currentCount && currentCount !== previousCount);
    };

    const processModalDialogs = () => {
      $('.modal-dialog.modal-content').each((index, element) => {
        const $el = $(element);
        const currentContent = $el.html();
        const id = $el.attr('id');

        const styledContent = `
        <div style="border: 2px dashed #666;"> ${currentContent || ''} </div>
      `;

        $el.html(styledContent).removeClass('mfp-hide');
      });
    };

    /**
     * Updates relative URLs for `<a>` and `<img>` elements to be absolute and opens links in a new tab.
     */
    const updateRelativeURLs = () => {
      $('a, img').each((index, element) => {
        const $el = $(element);
        const href = $el.attr('href');
        const src = $el.attr('src');

        if (href) {
          if (href.startsWith('/')) {
            $el.attr('href', `${baseUrl}${href}`).attr('target', '_blank');
          } else if (/^(http|https):\/\//.test(href)) {
            $el.attr('target', '_blank');
          }
        }

        if (src && src.startsWith('/')) {
          $el.attr('src', `${baseUrl}${src}`);
        }
      });
    };

    // const updateFootnotes = () => {
    //   $('a[href^="#"]').each((index, element) => {
    //     const $el = $(element);
    //     const href = $el.attr('href');

    //     if (href) {
    //       $el.attr('href', `${href}`);
    //     }
    //   });
    // };

    /**
     * Removes unnecessary elements like the chat bottom bar.
     */
    const cleanupUnnecessaryElements = () => {
      $('section#chat-bottom-bar').remove();
    };

    const displayInvisibleElements = () => {
      // .hidden and .nojs-show also?
      $('.wb-inv').each((index, element) => {
        const $el = $(element);
        $el.css({
          border: '2px solid #6F9FFF',
        });
        $el.removeClass('wb-inv');
      });
    };

    const addToc = () => {
      const $tocSection = $('.section.mwsinpagetoc');
      if (!$tocSection.length) return;

      const tocLinks = $tocSection
        .find('a')
        .map((_, link) => {
          const $link = $(link);
          const href = $link.attr('href');
          return href?.startsWith('#')
            ? { id: href.slice(1), text: $link.text().trim() }
            : null;
        })
        .get();

      if (!tocLinks.length) return;

      $('h2, h3, h4, h5, h6').each((_, heading) => {
        const $heading = $(heading);
        const matchedLink = tocLinks.find(
          (link) => link.text === $heading.text().trim(),
        );
        if (matchedLink) $heading.attr('id', matchedLink.id);
      });
    };

    // Execute the processing steps
    await processAjaxReplacements();
    processModalDialogs();
    updateRelativeURLs();
    cleanupUnnecessaryElements();
    displayInvisibleElements();
    addToc();

    return $('main').html() || '';
  }

  private async createLiveDiffContent(): Promise<{
    liveDiffs: string;
    leftBlobContent: string;
    rightBlobContent: string;
  }> {
    const leftBlob = this.before()?.blob || '';
    const rightBlob = this.after()?.blob || '';

    const leftBlobContent = await this.extractContent(leftBlob);
    const rightBlobContent = await this.extractContent(rightBlob);

    const isValid = valid(leftBlobContent) && valid(rightBlobContent);

    const options: DiffOptions = {
      repeatingWordsAccuracy: 0,
      ignoreWhiteSpaceDifferences: false,
      orphanMatchThreshold: 0,
      matchGranularity: 4,
      combineWords: true,
    };

    let liveDiffs = isValid
      ? Diff.execute(leftBlobContent, rightBlobContent, options)
      : '';

    liveDiffs = liveDiffs.replace(
      /<(ins|del)[^>]*>(\s|&nbsp;|&#32;|&#160;|&#x00e2;|&#x0080;|&#x00af;|&#x202f;|&#xa0;)+<\/(ins|del)>/gis,
      ' ',
    );

    return { liveDiffs, leftBlobContent, rightBlobContent };
  }

  next() {
    const elementsArray = this.elements();
    const currentIndex = this.currentIndex();
    const newIndex =
      currentIndex === elementsArray.length ? 1 : currentIndex + 1;
    this.scrollToElement(newIndex);
  }

  prev() {
    const elementsArray = this.elements();
    const currentIndex = this.currentIndex();
    const newIndex =
      currentIndex === 1 || currentIndex === 0
        ? elementsArray.length
        : currentIndex - 1;
    this.scrollToElement(newIndex);
  }
  private scrollToElement(index: number): void {
    const shadowDOM = this.shadowDOM();
    if (!shadowDOM) return;

    const $ = load(shadowDOM.innerHTML);

    const targetElement = $(`[data-id="${index}"]`);
    if (!targetElement.length) return;

    $('.highlight').removeClass('highlight');

    $('details[open]').each((index, element) => {
      const $element = $(element);
      if (!$element.is(targetElement.closest('details'))) {
        $element.removeAttr('open');
      }
    });

    let parentDetails = targetElement.closest('details');
    while (parentDetails.length) {
      if (!parentDetails.attr('open')) {
        parentDetails.attr('open', '');
      }
      parentDetails = parentDetails.parent().closest('details');
    }

    targetElement.addClass('highlight');

    shadowDOM.innerHTML = $.html();

    const domTargetElement = shadowDOM.querySelector(`[data-id="${index}"]`);
    if (domTargetElement) {
      domTargetElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    this.currentIndex.set(index);
  }

  updateSelection(hash: string, side: 'left' | 'right'): void {
    const version = this.hashes().find((h) => h.hash === hash) || null;
    if (!version) return;

    side === 'left' ? this.before.set(version) : this.after.set(version);
  }

  private restoreConfig(config: PageConfig): void {
    if (config.before) this.before.set(config.before);
    if (config.after) this.after.set(config.after);
  }

  private restoreMainConfig(config: MainConfig): void {
    if (config.outputFormat) this.outputFormat.set(config.outputFormat);
    if (config.viewMode) this.viewMode.set(config.viewMode);
  }

  private useDefaultSelection(): void {
    const [first, second] = this.hashes();
    if (first && second) {
      this.before.set(second);
      this.after.set(first);
    }
  }

  changeOutputFormat(format: string) {
    this.outputFormat.set(format as 'side-by-side' | 'line-by-line');
    sessionStorage.setItem(
      `main-version-config`,
      JSON.stringify(this.config()),
    );
  }

  changeViewMode(mode: { value: string; label: string; description: string }) {
    this.viewMode.set(mode);
    sessionStorage.setItem(
      `main-version-config`,
      JSON.stringify(this.config()),
    );
  }

  getInitialSelection = (side: 'left' | 'right') =>
    computed(() => {
      const currentHash =
        side === 'left' ? this.before()?.hash : this.after()?.hash;
      const availableOptions = this.dropdownOptions(); // Explicit dependency on dropdownOptions

      // Ensure we track the available options and current hash explicitly
      const isCurrentHashAvailable = availableOptions.some(
        (option) => option.value === currentHash,
      );
      if (isCurrentHashAvailable) {
        return currentHash;
      }

      return availableOptions.length > 0 ? availableOptions[0].value : '';
    });

  getInitialSelectionView = () =>
    computed(() => {
      const currentView = this.viewMode()?.value;
      const viewModeOptions = this.viewModeOptions;

      if (viewModeOptions.some((option) => option.value === currentView)) {
        return currentView;
      }

      return viewModeOptions.length > 0 ? viewModeOptions[0].value : '';
    });
}
