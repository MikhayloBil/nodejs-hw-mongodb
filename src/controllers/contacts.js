import createHttpError from 'http-errors';
import * as contactServices from '../services/contact.js';
import parsePaginationParams from '../utils/parsePaginationParams.js';
import parseSortParams from '../utils/parseSortParams.js';
import { sortFields } from '../db/models/Contact.js';
import { saveFileToUploadDir } from '../utils/saveFileToUploadDir.js';
import saveFileToCloudinary from '../utils/saveFileToCloudinary.js';
import { env } from '../utils/env.js';

export const getAllContactsController = async (req, res) => {
  const { _id: userId } = req.user;
  const { perPage, page } = parsePaginationParams(req.query);
  const { sortBy, sortOrder } = parseSortParams({ ...req.query, sortFields });
  const data = await contactServices.getAllContacts({
    perPage,
    page,
    sortBy,
    sortOrder,
    userId,
  });

  res.json({
    status: 200,
    message: 'Successfully found contacts!',
    data,
  });
};

export const getAllContactsByIdControler = async (req, res) => {
  const { id } = req.params;
  const { _id: userId } = req.user;
  const data = await contactServices.getContactById({ _id: id, userId });

  if (!data) {
    throw createHttpError(404, 'Contact not found');
  }
  res.json({
    status: 200,
    message: `Successfully found contact with id=${id}!`,
    data,
  });
};

export const addContactsControler = async (req, res) => {
  const photo = req.file;
  let photoUrl;
  if (photo) {
    if (process.env.ENABLE_CLOUDINARY === 'true') {
      photoUrl = await saveFileToCloudinary(req.file, 'photo');
    } else {
      photoUrl = await saveFileToUploadDir(req.file);
    }
  }

  const { _id: userId } = req.user;

  const { name, phoneNumber, email, isFavourite, contactType } = req.body;
  if (!name || !phoneNumber || !contactType) {
    throw createHttpError(
      400,
      'Missing required fields: name, phoneNumber, or contactType',
    );
  }
  const data = await contactServices.createContact({
    name,
    phoneNumber,
    email: email || '',
    isFavourite: isFavourite || false,
    contactType,
    userId,
    photoUrl,
  });

  res.status(201).json({
    status: 201,
    message: 'Successfully created a contact!',
    data,
  });
};

export const patchContactController = async (req, res) => {
  const { id } = req.params;
  const { _id: userId } = req.user;
  const photo = req.file;
  let photoUrl;
  if (photo) {
    if (process.env.ENABLE_CLOUDINARY === 'true') {
      photoUrl = await saveFileToCloudinary(req.file, 'photo');
    } else {
      photoUrl = await saveFileToUploadDir(req.file);
    }
  }
  const result = await contactServices.updateContact(
    { _id: id, userId, photo: photoUrl },
    req.body,
  );

  if (!result) {
    throw createHttpError(404, 'Contact not found');
  }

  res.json({
    status: 200,
    message: 'Successfully patched a contact!',
    data: result.data,
  });
};

export const deleteContactController = async (req, res) => {
  const { id } = req.params;
  const { _id: userId } = req.user;
  const data = await contactServices.deleteContact({ _id: id, userId });

  if (!data) {
    throw createHttpError(404, 'Contact not found');
  }

  res.status(204).send();
};
