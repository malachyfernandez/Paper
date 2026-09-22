import { MathDocumentPage } from '../../types/mathDocuments';

interface DownloadViewOnlyMarkdownArgs {
    documentTitle: string;
    documentDescription?: string;
    pages: MathDocumentPage[];
}

const sanitizeFileName = (value: string) => {
    const sanitized = value
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 80)
        .trim();

    return sanitized || 'math-document';
};

export const downloadViewOnlyMarkdown = ({
    documentTitle,
    documentDescription,
    pages,
}: DownloadViewOnlyMarkdownArgs) => {
    if (typeof window === 'undefined') {
        return;
    }

    const title = documentTitle?.trim() || 'Math document';
    const sections: string[] = [`# ${title}`];

    if (documentDescription?.trim()) {
        sections.push(documentDescription.trim());
    }

    pages.forEach((page) => {
        const pageHeading = `## Page ${page.pageNumber}${page.title?.trim() ? `: ${page.title.trim()}` : ''}`;
        const pageMarkdown = page.markdown?.trim() || '_No markdown content for this page._';
        sections.push(`${pageHeading}\n\n${pageMarkdown}`);
    });

    const markdownContent = sections.join('\n\n---\n\n') + '\n';

    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = `${sanitizeFileName(title)}.md`;
    window.document.body.appendChild(anchor);
    anchor.click();
    window.document.body.removeChild(anchor);

    window.setTimeout(() => URL.revokeObjectURL(url), 0);
};
