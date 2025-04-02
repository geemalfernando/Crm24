import { getProdModel } from '../../../models/SampleModel';

export default async function handler(req, res) {
  try {
    const ProdModel = getProdModel();
    const sampleDoc = await ProdModel.findOne().lean();
    
    const columns = sampleDoc ? Object.keys(sampleDoc).filter(
      key => !['_id', '__v'].includes(key)
    ) : [];

    res.status(200).json({ columns });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}