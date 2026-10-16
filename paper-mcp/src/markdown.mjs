/** Mirrors components/mathDocuments/downloadViewOnlyMarkdown.ts section format. */
export const assembleDocumentMarkdown = ({ title, description, pages }) => {
    const sections = [`# ${title?.trim() || 'Math document'}`];

    if (description?.trim()) {
        sections.push(description.trim());
    }

    const sorted = [...(pages ?? [])].sort((a, b) => (a.pageNumber ?? 0) - (b.pageNumber ?? 0));
    for (const page of sorted) {
        const heading = `## Page ${page.pageNumber}${page.title?.trim() ? `: ${page.title.trim()}` : ''}`;
        const body = page.markdown?.trim() || '_No markdown content for this page._';
        sections.push(`${heading}\n\n${body}`);
    }

    return sections.join('\n\n---\n\n') + '\n';
};
