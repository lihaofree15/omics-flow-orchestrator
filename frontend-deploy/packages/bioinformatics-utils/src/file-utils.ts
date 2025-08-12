/**
 * Bioinformatics file utility functions
 */

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getFileTypeFromExtension(filename: string): string {
  const extension = filename.toLowerCase().split('.').pop();
  
  const fileTypeMap: Record<string, string> = {
    'fastq': 'fastq',
    'fq': 'fastq',
    'fasta': 'fasta',
    'fa': 'fasta',
    'fas': 'fasta',
    'bam': 'bam',
    'sam': 'sam',
    'vcf': 'vcf',
    'gff': 'gff',
    'gff3': 'gff',
    'gtf': 'gtf',
    'bed': 'bed',
    'csv': 'csv',
    'tsv': 'tsv',
    'txt': 'txt',
    'gz': getFileTypeFromExtension(filename.replace(/\.gz$/, '')), // Handle compressed files
  };
  
  return fileTypeMap[extension || ''] || 'other';
}

export function validateFastqFile(content: string): boolean {
  // Basic FASTQ validation - check first few lines
  const lines = content.split('\n').slice(0, 4);
  
  if (lines.length < 4) return false;
  
  // First line should start with @
  if (!lines[0].startsWith('@')) return false;
  
  // Third line should start with +
  if (!lines[2].startsWith('+')) return false;
  
  // Quality line should have same length as sequence
  if (lines[1].length !== lines[3].length) return false;
  
  return true;
}

export function validateFastaFile(content: string): boolean {
  // Basic FASTA validation
  const lines = content.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) return false;
  
  // First line should start with >
  if (!lines[0].startsWith('>')) return false;
  
  // Check that sequence lines contain valid nucleotides/amino acids
  const sequenceLines = lines.slice(1);
  const validChars = /^[ACGTRYSWKMBDHVN-]+$/i; // Extended nucleotide codes
  
  return sequenceLines.every(line => 
    line.startsWith('>') || validChars.test(line.trim())
  );
}

export function detectFileFormat(filename: string, content?: string): string {
  const extension = getFileTypeFromExtension(filename);
  
  if (content) {
    // Use content to validate/detect format
    if (extension === 'fastq' && validateFastqFile(content)) {
      return 'fastq';
    }
    if ((extension === 'fasta' || extension === 'fa') && validateFastaFile(content)) {
      return 'fasta';
    }
  }
  
  return extension;
}

export function parseMetadataFromFilename(filename: string): Record<string, string> {
  const metadata: Record<string, string> = {};
  
  // Common patterns in bioinformatics filenames
  const patterns = [
    { regex: /_(R[12])_/, key: 'readType' },
    { regex: /_([12])\.fastq/, key: 'readNumber' },
    { regex: /_(S\d+)_/, key: 'sampleNumber' },
    { regex: /_(L\d+)_/, key: 'lane' },
    { regex: /trimmed/, key: 'processed', value: 'trimmed' },
    { regex: /filtered/, key: 'processed', value: 'filtered' },
  ];
  
  patterns.forEach(({ regex, key, value }) => {
    const match = filename.match(regex);
    if (match) {
      metadata[key] = value || match[1];
    }
  });
  
  return metadata;
}