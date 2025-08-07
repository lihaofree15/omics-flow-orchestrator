#!/usr/bin/env nextflow

/*
 * Bioinformatics Analysis Pipeline
 * A modular Nextflow pipeline for various bioinformatics analyses
 */

nextflow.enable.dsl=2

// Include workflow modules
include { QUALITY_CONTROL } from './modules/quality_control'
include { ALIGNMENT } from './modules/alignment'
include { QUANTIFICATION } from './modules/quantification'
include { DIFFERENTIAL_EXPRESSION } from './modules/differential_expression'
include { VARIANT_CALLING } from './modules/variant_calling'

// Default parameters
params.input = ''
params.outdir = 'results'
params.analysis_type = 'rna-seq'
params.reference_genome = ''
params.annotation = ''
params.config_file = ''

// Import configuration
if (params.config_file) {
    includeConfig params.config_file
}

workflow {
    // Input validation
    if (!params.input) {
        error "Please provide input files with --input"
    }

    // Create input channel
    input_ch = Channel.fromPath(params.input)
        .map { file -> [file.simpleName, file] }

    // Main workflow logic based on analysis type
    switch(params.analysis_type) {
        case 'rna-seq':
            QUALITY_CONTROL(input_ch)
            ALIGNMENT(QUALITY_CONTROL.out.trimmed_reads)
            QUANTIFICATION(ALIGNMENT.out.aligned_bam)
            DIFFERENTIAL_EXPRESSION(QUANTIFICATION.out.counts)
            break
            
        case 'dna-seq':
            QUALITY_CONTROL(input_ch)
            ALIGNMENT(QUALITY_CONTROL.out.trimmed_reads)
            VARIANT_CALLING(ALIGNMENT.out.aligned_bam)
            break
            
        case 'variant-calling':
            ALIGNMENT(input_ch)
            VARIANT_CALLING(ALIGNMENT.out.aligned_bam)
            break
            
        default:
            error "Unknown analysis type: ${params.analysis_type}"
    }
}

workflow.onComplete {
    println "Pipeline completed at: $workflow.complete"
    println "Execution status: ${ workflow.success ? 'OK' : 'failed' }"
}