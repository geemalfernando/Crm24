import { getProdModel, getDevModel } from '../../../models/SampleModel';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.setHeader('Allow', ['POST'])
             .status(405)
             .json({ 
               success: false,
               message: 'Method not allowed',
               allowedMethods: ['POST']
             });
  }

  try {
    // Validate request body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Request body must be a JSON object'
      });
    }

    const { columns } = req.body;
    
    // Validate columns parameter
    if (!columns || !Array.isArray(columns)) {
      return res.status(400).json({
        success: false,
        error: 'Columns must be provided as an array of field names'
      });
    }

    if (columns.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one column must be specified'
      });
    }

    // Get models for both databases
    const ProdModel = getProdModel();
    const DevModel = getDevModel();

    // Create projection with validation
    const projection = {};
    const validColumns = [];
    const invalidColumns = [];
    
    // Get sample document to validate columns exist
    const sampleDoc = await ProdModel.findOne().lean();
    const existingColumns = sampleDoc ? Object.keys(sampleDoc) : [];
    
    columns.forEach(col => {
      if (existingColumns.includes(col) && !['_id', '__v'].includes(col)) {
        projection[col] = 1;
        validColumns.push(col);
      } else {
        invalidColumns.push(col);
      }
    });

    if (validColumns.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid columns specified',
        invalidColumns,
        availableColumns: existingColumns.filter(c => !['_id', '__v'].includes(c))
      });
    }

    // Add batch processing for large datasets
    const batchSize = 1000;
    let totalCloned = 0;
    let cursor = ProdModel.find({}, projection).lean().cursor();
    
    // Process in batches to avoid memory issues
    for (let batch = []; (batch = await cursor.next(batchSize)) && batch.length > 0;) {
      const insertResult = await DevModel.insertMany(batch);
      totalCloned += insertResult.length;
    }

    res.status(200).json({
      success: true,
      message: 'Columns cloned successfully',
      count: totalCloned,
      columnsCloned: validColumns,
      ...(invalidColumns.length > 0 && {
        warning: 'Some columns were invalid',
        invalidColumns,
        availableColumns: existingColumns.filter(c => !['_id', '__v'].includes(c))
      })
    });

  } catch (error) {
    console.error('Column cloning failed:', error);
    
    // Handle specific MongoDB errors
    let errorMessage = error.message;
    let statusCode = 500;
    
    if (error.name === 'MongoServerError') {
      if (error.code === 16500) { // Request rate too large
        statusCode = 429;
        errorMessage = 'Database request limit exceeded. Please try again later.';
      }
    }

    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack
      })
    });
  }
}