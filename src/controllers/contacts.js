import createHttpError from 'http-errors';
import * as contactServices from '../services/contact.js';

export const getAllContactsController = async (req, res) => {
  const data = await contactServices.getAllContacts();

  res.json({
    status: 200,
    message: 'Successfully found contacts!',
    data,
  });
};

export const getAllContactsByIdControler = async (req, res) => {
  const { id } = req.params;
  const data = await contactServices.getContactById(id);

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
  });

  res.status(201).json({
    status: 201,
    message: 'Successfully created a contact!',
    data,
  });
};

export const patchContactController = async (req, res) => {
  const { id } = req.params;
  const result = await contactServices.updateContact({ _id: id }, req.body);

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
  const data = await contactServices.deleteContact({ _id: id });

  if (!data) {
    throw createHttpError(404, 'Contact not found');
  }

  res.status(204).send();
};
