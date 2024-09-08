const errorHandler = (error, req, res, next) => {
  const { status = 500, message = 'Something went wrong' } = error;

  res.status(status).json({
    status: 500,
    message,
    data: error.message || 'Internal server error',
  });
};

export default errorHandler;
