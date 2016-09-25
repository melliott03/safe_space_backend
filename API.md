## Login

Generate a deviceId (UUID) and a secret (also UUID).  Submit:

```
POST /api/login
{
  deviceId: UUID,
  secret: UUID
}

=>

{
  token: string
}
```

You now submit `token` with every request.

## Other methods

### Update location

Periodically you will ping:

```
POST /api/location-ping
{
  token: token,
  location: {
    type: "Point",
    coordinates: [long, lat]
  }
}
```

Returns OK (not JSON)

### Events

This may or may not ask for witnesses.  This can be used to create and update the event.  Change the `requestWitnesses` flag to request or cancel requests for witnesses.

```
POST /api/event/:eventId
{
  token: token,
  location: {
    type: "Point",
    coordinates: [long, lat]
  },
  requestWitnesses: true/false,
  done: true/false
}
```

This can be used to create or update an event.

If a key is left out then it is not edited.  This returns the updated event object.

`done` if true means that the event is over and you are done (it's now a historical event).

`id` and `token` are required.

### Indicate you will respond to an event

This is used to say that you are responding to an event, what your status is, and what you are doing.

```
POST /api/responding/:eventId
{
  token: token,
  location: {
    type: "Point",
    coordinates: [long, lat]
  },
  arrived: true/false,
  filming: true/false,
  done: true/false
}
```

`done` means you have left and are now ignoring the event.

Before you have arrived, you can do:

```
DELETE /api/responding/:eventId
```

to indicate you are not coming.

### Profiles

You can set or update your profile with:

```
POST /api/profile
{
  token: token,
  profile: {... anything ...}
}
```
