export type RenderedPdfPage = {
    id: string;
    pageNumber: number;
    previewUrl: string;
    file: File;
};

export const renderPdfFileToImages = async (
    file: File,
    onProgress?: (completed: number, total: number) => void,
): Promise<RenderedPdfPage[]> => {
    throw new Error('PDF import is currently supported on web only.');
};

export const renderPdfUrlToImages = async (
    url: string,
): Promise<RenderedPdfPage[]> => {
    throw new Error('PDF import is currently supported on web only.');
};

export const isPdfUrl = (url: string): boolean => {
    return url.toLowerCase().endsWith('.pdf') || 
           url.toLowerCase().startsWith('data:application/pdf');
};

export const isPdfFile = (file: File): boolean => {
    return file.type === 'application/pdf' || 
           file.name.toLowerCase().endsWith('.pdf');
};
