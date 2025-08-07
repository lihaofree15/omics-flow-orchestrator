#!/usr/bin/env nextflow

nextflow.enable.dsl=2

process FASTQC {
    tag "$sample_id"
    publishDir "${params.outdir}/qc/fastqc", mode: 'copy'

    input:
    tuple val(sample_id), path(reads)

    output:
    path "*_fastqc.{zip,html}", emit: fastqc_reports
    tuple val(sample_id), path(reads), emit: reads

    script:
    """
    fastqc \\
        --threads ${task.cpus} \\
        --outdir . \\
        ${reads}
    """
}

process TRIMMOMATIC {
    tag "$sample_id"
    publishDir "${params.outdir}/trimmed", mode: 'copy'

    input:
    tuple val(sample_id), path(reads)

    output:
    tuple val(sample_id), path("*_trimmed.fastq.gz"), emit: trimmed_reads
    path "*_unpaired.fastq.gz", emit: unpaired_reads
    path "*.log", emit: trimmomatic_log

    script:
    if (reads.size() == 2) {
        """
        trimmomatic PE \\
            -threads ${task.cpus} \\
            -phred33 \\
            ${reads[0]} ${reads[1]} \\
            ${sample_id}_R1_trimmed.fastq.gz ${sample_id}_R1_unpaired.fastq.gz \\
            ${sample_id}_R2_trimmed.fastq.gz ${sample_id}_R2_unpaired.fastq.gz \\
            ILLUMINACLIP:${params.adapter_file}:2:30:10:2:keepBothReads \\
            SLIDINGWINDOW:4:20 \\
            LEADING:3 \\
            TRAILING:3 \\
            MINLEN:36 \\
            2> ${sample_id}_trimmomatic.log
        """
    } else {
        """
        trimmomatic SE \\
            -threads ${task.cpus} \\
            -phred33 \\
            ${reads[0]} \\
            ${sample_id}_trimmed.fastq.gz \\
            ILLUMINACLIP:${params.adapter_file}:2:30:10 \\
            SLIDINGWINDOW:4:20 \\
            LEADING:3 \\
            TRAILING:3 \\
            MINLEN:36 \\
            2> ${sample_id}_trimmomatic.log
        """
    }
}

process MULTIQC {
    publishDir "${params.outdir}/qc", mode: 'copy'

    input:
    path fastqc_reports

    output:
    path "multiqc_report.html", emit: multiqc_report
    path "multiqc_data", emit: multiqc_data

    script:
    """
    multiqc \\
        --force \\
        --filename multiqc_report.html \\
        .
    """
}

workflow QUALITY_CONTROL {
    take:
    reads_ch

    main:
    // FastQC analysis
    FASTQC(reads_ch)
    
    // Trimming with Trimmomatic
    TRIMMOMATIC(FASTQC.out.reads)
    
    // Post-trimming FastQC
    FASTQC_POST = FASTQC
    FASTQC_POST(TRIMMOMATIC.out.trimmed_reads)
    
    // Collect all QC reports
    qc_reports = FASTQC.out.fastqc_reports
        .mix(FASTQC_POST.out.fastqc_reports)
        .collect()
    
    // MultiQC summary
    MULTIQC(qc_reports)

    emit:
    trimmed_reads = TRIMMOMATIC.out.trimmed_reads
    fastqc_reports = FASTQC.out.fastqc_reports
    multiqc_report = MULTIQC.out.multiqc_report
}