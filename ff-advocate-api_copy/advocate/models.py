import uuid

from django.db import models
from django.contrib.postgres.fields import JSONField


class AppUser(models.Model):
    id = models.TextField(primary_key=True)

    data = JSONField(default=dict)

    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)


class Device(models.Model):
    id = models.TextField(primary_key=True)

    data = JSONField(default=dict)

    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)


class Activity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    data = JSONField(default=dict)

    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    logged_at = models.DateTimeField()

    client_id = models.TextField(
        null=True, blank=True, db_index=True, unique=True
    )

    activity_type = models.TextField(db_index=True)
    activity_key = models.TextField(db_index=True)

    user = models.ForeignKey(AppUser, on_delete=models.CASCADE)
    device = models.ForeignKey(Device, on_delete=models.CASCADE)

    user_data = JSONField(default=dict)
    device_data = JSONField(default=dict)


class DeliveredSession(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    user_email = models.TextField(db_index=True)
    session_id = models.TextField(db_index=True)

    session_start = models.DateTimeField()
    session_end = models.DateTimeField()

    participants = JSONField(default=dict)
    participants_count = models.IntegerField(null=True, blank=True)

    extra = JSONField(default=dict)

    client_id = models.TextField(
        null=True, blank=True, db_index=True, unique=True
    )

    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)


class BookedActivationSession(models.Model):
    user_email = models.CharField(max_length=250)
    programme_id = models.IntegerField()

    booking_starts = models.DateTimeField(
        help_text="When is the activation session booked for?"
    )

    booking_url = models.URLField(
        null=True,
        blank=True,
        help_text="Optional URL used for the user to attend their activation session (e.g. a web conferencing link)",
    )
    booking_message = models.CharField(
        max_length=140,
        help_text="Message presented to users who wish to join/attend their activation session",
    )

    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (("user_email", "programme_id"),)


class ProgrammeActivationOptions(models.Model):
    programme_id = models.IntegerField(unique=True)

    enabled = models.BooleanField()
    use_coach_calls = models.BooleanField(default=False)
    request_message = models.CharField(
        max_length=140,
        help_text="Message presented to users who wish to book an activation session",
    )
    request_url = models.URLField(
        null=True,
        blank=True,
        help_text="Optional URL that users booking an activation session should be sent to",
    )

    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)


class CoachCall(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)

    programme_id = models.IntegerField(db_index=True)

    call_starts = models.DateTimeField(
        help_text="When is the calls booked for?", db_index=True
    )

    call_url = models.URLField(
        null=True,
        blank=True,
        help_text="Optional URL used for the user to attend their calls (e.g. a web conferencing link)",
    )
    call_message = models.CharField(
        max_length=140,
        help_text="Message presented to users who wish to join/attend their calls",
    )

    created = models.DateTimeField(auto_now_add=True)
    updated = models.DateTimeField(auto_now=True)
