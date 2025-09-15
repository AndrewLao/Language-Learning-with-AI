from django.contrib.auth.models import Group, User
from rest_framework import viewsets

from backend.chatbot.serializers import GroupSerializer, UserSerializer, StringInputSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from openai import OpenAI

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer


class GroupViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Group.objects.all().order_by('name')
    serializer_class = GroupSerializer

class StringEchoView(APIView):
    def post(self, request):
        serializer = StringInputSerializer(data=request.data)
        if serializer.is_valid():
            input_str = serializer.validated_data['input_string']
            if input_str == "a":
                return Response({"result": "a"}, status=status.HTTP_200_OK)
            else:
                return Response({"result": "b"}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class AIResponseView(APIView):
    def post(self, request):
        serializer = StringInputSerializer(data=request.data)
        if serializer.is_valid():
            input_str = serializer.validated_data['input_string']
            client = OpenAI(
                api_key="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"
            )

            response = client.responses.create(
                model="gpt-5-nano",
                input=input_str,
                store=True,
            )
            return Response({"result": response.output_text}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)