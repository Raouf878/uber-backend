export const CreatePayment = async (req, res) => {
  try {
    // Payment creation logic
    res.status(201).json({
      success: true,
      message: 'Payment created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
