import graphene
from django.db import transaction
from django.utils.timezone import now
from graphene_django import DjangoObjectType
import logging

from advocate import models

logger = logging.getLogger(__name__)


class ActivationBooking(DjangoObjectType):
    class Meta:
        model = models.BookedActivationSession
        exclude_fields = ("id", "user_email", "programme_id")


class RequestActivationBooking(DjangoObjectType):
    class Meta:
        model = models.ProgrammeActivationOptions
        exclude_fields = ("id", "programme_id", "created", "updated")


class ActivationDetails(graphene.ObjectType):
    request_booking = graphene.Field(RequestActivationBooking, required=True)
    booked_activation = graphene.Field(ActivationBooking, required=False)


class CoachCall(DjangoObjectType):
    class Meta:
        model = models.CoachCall
        exclude_fields = ("id", "programme_id", "created", "updated")


class ListUpcomingCoachCalls(graphene.ObjectType):
    count = graphene.Int(required=True)
    calls = graphene.NonNull(graphene.List(graphene.NonNull(CoachCall)))


class Query(graphene.ObjectType):
    hello = graphene.String(required=True)

    activation_details = graphene.Field(
        ActivationDetails,
        user_email=graphene.String(required=True),
        programme_id=graphene.Int(required=True),
        required=True,
    )

    programme_supports_activation = graphene.Field(
        graphene.Boolean,
        programme_id=graphene.Int(required=True),
        required=True,
    )

    list_upcoming_coach_calls = graphene.Field(
        ListUpcomingCoachCalls,
        programme_id=graphene.Int(required=True),
        required=True,
    )

    def resolve_hello(self, info, **kwargs):
        return "Hello, World!"

    def resolve_activation_details(self, info, user_email, programme_id):
        request_booking = models.ProgrammeActivationOptions.objects.get(
            programme_id=programme_id
        )

        booked_activation = models.BookedActivationSession.objects.filter(
            user_email=user_email, programme_id=programme_id
        ).first()

        return ActivationDetails(
            request_booking=request_booking,
            booked_activation=booked_activation,
        )

    def resolve_programme_supports_activation(self, info, programme_id: int):
        supported = models.ProgrammeActivationOptions.objects.filter(
            programme_id=programme_id
        ).exists()
        return supported

    def resolve_list_upcoming_coach_calls(
        self, call_starts, programme_id: int
    ):
        start_call = models.CoachCall.objects.filter(
            call_starts__gte=now(), programme_id=programme_id
        )
        return ListUpcomingCoachCalls(
            count=start_call.count(), calls=start_call
        )


class AppUser(DjangoObjectType):
    class Meta:
        model = models.AppUser


class Device(DjangoObjectType):
    class Meta:
        model = models.Device


class Activity(DjangoObjectType):
    class Meta:
        model = models.Activity


class CurrentUserInput(graphene.InputObjectType):
    id = graphene.String(required=True)

    data = graphene.JSONString(required=True)


class CurrentDeviceInput(graphene.InputObjectType):
    id = graphene.String(required=True)

    data = graphene.JSONString(required=True)


class LogActivityInput(graphene.InputObjectType):
    activity_type = graphene.String(required=True)
    activity_key = graphene.String(required=True)

    data = graphene.JSONString(required=True)

    logged_at = graphene.DateTime()
    client_id = graphene.String()


class LogActivities(graphene.Mutation):
    class Arguments:
        current_user = CurrentUserInput(required=True)
        current_device = CurrentDeviceInput(required=True)
        activities = graphene.List(
            graphene.NonNull(LogActivityInput), required=True
        )

    current_user = graphene.Field(AppUser, required=True)
    current_device = graphene.Field(Device, required=True)
    activities = graphene.List(graphene.NonNull(Activity))

    def mutate(self, info, current_user, current_device, activities):
        app_user, created = models.AppUser.objects.get_or_create(
            id=current_user.id, defaults={"data": current_user.data}
        )
        if not created:
            app_user.data = current_user.data
            app_user.save()

        device, created = models.Device.objects.get_or_create(
            id=current_device.id, defaults={"data": current_device.data}
        )
        if not created:
            device.data = current_device.data
            device.save()

        saved_activities = []

        for activity_input in activities:
            if activity_input.client_id:
                activity, created = models.Activity.objects.get_or_create(
                    client_id=activity_input.client_id,
                    defaults={
                        "data": activity_input.data,
                        "logged_at": activity_input.logged_at or now(),
                        "activity_type": activity_input.activity_type,
                        "activity_key": activity_input.activity_key,
                        "user": app_user,
                        "device": device,
                        "user_data": app_user.data,
                        "device_data": device.data,
                    },
                )
            else:
                activity = models.Activity()
                created = False

            if not created:
                activity.data = activity_input.data
                activity.logged_at = activity_input.logged_at or now()
                activity.activity_type = activity_input.activity_type
                activity.activity_key = activity_input.activity_key
                activity.user = app_user
                activity.device = device
                activity.save()

            saved_activities.append(activity)

        return LogActivities(
            current_user=app_user,
            current_device=device,
            activities=saved_activities,
        )


class LogDeliveredSession(graphene.Mutation):
    class Arguments:
        user_email = graphene.String(required=True)
        session_id = graphene.String(required=True)

        session_start = graphene.DateTime(required=True)
        session_end = graphene.DateTime(required=True)

        participants = graphene.JSONString(required=False)
        participants_count = graphene.Int(required=False)

        extra = graphene.JSONString(required=True)

        client_id = graphene.String(required=False)

    delivered_session_id = graphene.ID(required=True)

    @transaction.atomic
    def mutate(
        self,
        info,
        user_email,
        session_id,
        session_start,
        session_end,
        extra,
        participants=None,
        participants_count=None,
        client_id=None,
    ):
        if client_id:
            models.DeliveredSession.objects.filter(
                client_id=client_id
            ).delete()

        delivered_session = models.DeliveredSession.objects.create(
            user_email=user_email,
            session_id=session_id,
            session_start=session_start,
            session_end=session_end,
            participants=participants or {},
            participants_count=participants_count,
            extra=extra,
            client_id=client_id,
        )

        return LogDeliveredSession(delivered_session_id=delivered_session.id)


class BookActivationSessionInput(graphene.InputObjectType):
    user_email = graphene.String(required=True)
    programme_id = graphene.Int(required=True)

    booking_starts = graphene.DateTime(required=True)

    booking_url = graphene.String(required=False)
    booking_message = graphene.String(required=True)


class BookActivationSessionMutation(graphene.Mutation):
    class Arguments:
        input = BookActivationSessionInput(required=True)

    booked_activation = graphene.Field(ActivationBooking, required=True)

    def mutate(self, info, input: BookActivationSessionInput):
        session, created = models.BookedActivationSession.objects.get_or_create(
            user_email=input.user_email,
            programme_id=input.programme_id,
            defaults={
                "booking_starts": input.booking_starts,
                "booking_url": input.booking_url,
                "booking_message": input.booking_message,
            },
        )
        if not created:
            session.booking_starts = input.booking_starts
            session.booking_url = input.booking_url
            session.booking_message = input.booking_message
            session.save()

        return BookActivationSessionMutation(booked_activation=session)


class Mutation(graphene.ObjectType):
    log_activities = LogActivities.Field()
    log_delivered_session = LogDeliveredSession.Field()

    book_user_activation_session = BookActivationSessionMutation.Field(
        required=True
    )


schema = graphene.Schema(query=Query, mutation=Mutation)
