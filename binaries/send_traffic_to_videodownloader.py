import asyncio
import base64
import socket, threading
import queue
import time

from mitmproxy import ctx
from mitmproxy import http
LISTENING_PORT = 12000   
# Queue to hold shared data
data_queue = queue.Queue(maxsize=15)

def startserver(selfs):
  data=''
  try:
    while data=='':
        try:
          data=selfs.socket_connection.recv(1)
          print(data)
          selfs.socket_instance.close();
          selfs.socket_connection.close();
          ctx.master.shutdown()
        except:
          pass
        if data_queue.qsize()>0:
            msg = data_queue.get()        
            if msg is not None:
              selfs.socket_connection.send(msg.encode())
        #else:
        #   if selfs.socket_connection.recv(data)>0:selfs.socket_connection .send('testconnection'.encode()) #dirty connection test require to exit properly
        #time.sleep(1)
  except:  
    selfs.socket_instance.close();
    selfs.socket_connection.close();
    ctx.master.shutdown()
  selfs.socket_instance.close();
  selfs.socket_connection.close();
  ctx.master.shutdown() 
class TrafficLogger:
  def __init__(self):
    
      # Create server and specifying that it can only handle 4 connections by time!
    self.socket_instance = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    #self.socket_instance.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    self.socket_instance.bind(('127.0.0.1', LISTENING_PORT))
    self.socket_instance.listen(1) #limit to one client
    print('Server running!')
      # Accept client connection

    
    self.socket_connection, self.address = self.socket_instance.accept()
    self.socket_connection.setblocking(False)
    print('new listener!')

    # Create a thread
    thread = threading.Thread(target=startserver, args=([self]))

    # Start the thread
    thread.start()

  def __del__(self):
    print("Object destroyed")
    #self.socket_instance.close();
     
        
  def request(self, flow):
    self.checkflow(flow, False)
  def response(self, flow):
    self.checkflow(flow, True)
    return

  def checkflow(self,flow,isrep):

    #print("FOR: " + flow.request.url)
    url='"'+flow.request.method + " " + flow.request.url+ " " + flow.request.http_version+'"'
    url='"'    + flow.request.url+  '"'
 


    headers="["
    #print("-"*50 + "request headers:")
    for k, v in flow.request.headers.items():
        #print("%-20s: %s" % (k.upper(), v))
        if k!='If-Range':
           headers=headers+'{"k":"'+k+'"'+',"v":'+'"'+v.replace("\"","\\\"")+'"'+'},'
    headers=headers[:-1]+"]"
    rheaders="[]"
    #print("-"*50 + "response headers:")
    if isrep:    
      rheaders="["
      for k, v in flow.response.headers.items():
        #print("%-20s: %s" % (k.upper(), v))
        #print("-"*50 + "request headers:")
        rheaders=rheaders+'{"k":"'+k+'"'+',"v":'+'"'+v.replace("\"","\\\"")+'"'+'},'
      rheaders=rheaders[:-1]+"]"
    #don't send large response    
    data=""
    if isrep:
      if len(flow.response.text)<50000000:
         #print(flow.response.text);
       
       try:
         #data=flow.response.text.replace("\"","\\\"") #.encode("utf-8")# str(flow.response.text, encoding='utf-8')  #flow.response.text.decode("utf-8");
         data=base64.b64encode(flow.response.content).decode("ascii")
       except:
         data=""
    msg='{"url":'+url+',"headers":'+headers+',"rheaders":'+rheaders+',"response":"'+data+'"}'
    #self.socket_instance.send(len(msg))
    data_queue.put(msg)
    #if self.socket_connection.send(msg.encode()) ==0:
    #    self.socket_connection.close();
    #    self.socket_instance.close();


addons = [TrafficLogger()]    
