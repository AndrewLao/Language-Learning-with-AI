from django.contrib.auth.models import Group, User
from rest_framework import viewsets

from backend.chatbot.ai_response import chat_with_llm
from backend.chatbot.serializers import GroupSerializer, UserSerializer, StringInputSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# from openai import OpenAI

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

            response = chat_with_llm("test_session", input_str)
            return Response({"result": response}, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)